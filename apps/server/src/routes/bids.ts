import { Router, Request, Response, IRouter } from 'express';
import mongoose from 'mongoose';
import { Car } from '../models/Car';
import { Bid } from '../models/Bid';
import { Notification } from '../models/Notification';
import { requireAuth } from '../middleware/auth';
import { maskName } from '@car-auction/shared';
import { getIO } from '../socket';

const router: IRouter = Router();

// ─── POST /api/cars/:id/bid ───────────────────────────────────────────────────
// Concurrency-safe bid placement + anti-sniping auto-extension + Socket.io broadcast
router.post('/cars/:id/bid', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const carId = req.params.id;
    const { amount } = req.body as { amount?: number };

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ message: 'Valid positive bid amount is required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      res.status(400).json({ message: 'Invalid vehicle ID format' });
      return;
    }

    // 1. Initial check on car existence and rules
    const existingCar = await Car.findById(carId);
    if (!existingCar) {
      res.status(404).json({ message: 'Car listing not found' });
      return;
    }

    // Auction active check
    const now = new Date();
    if (existingCar.status !== 'live' || new Date(existingCar.auctionEnd).getTime() <= now.getTime()) {
      res.status(400).json({ message: 'Auction is not live or has already ended' });
      return;
    }

    // Cannot bid on your own listing
    if (String(existingCar.sellerId) === req.user!.sub) {
      res.status(400).json({ message: 'Sellers cannot bid on their own listings' });
      return;
    }

    // Calculate minimum bid increment ($100 minimum or 1% of current bid)
    const minIncrement = Math.max(100, Math.round(existingCar.currentBid * 0.01));
    const minRequiredBid = existingCar.currentBid + minIncrement;

    if (amount < minRequiredBid) {
      res.status(400).json({
        message: `Bid must be at least $${minRequiredBid.toLocaleString()} (minimum increment is $${minIncrement.toLocaleString()})`,
        minRequiredBid,
        minIncrement,
      });
      return;
    }

    // 2. ATOMIC CONDITIONAL UPDATE — the race condition fix
    let updatedCar = await Car.findOneAndUpdate(
      {
        _id: carId,
        currentBid: { $lt: amount },
        status: 'live',
        auctionEnd: { $gt: now },
      },
      {
        $set: {
          currentBid: amount,
        },
        $inc: { bidCount: 1 },
      },
      { new: true },
    );

    // 3. Handle atomic update failure (concurrency conflict or state change)
    if (!updatedCar) {
      const freshCar = await Car.findById(carId);
      if (!freshCar || freshCar.status !== 'live' || new Date(freshCar.auctionEnd).getTime() <= now.getTime()) {
        res.status(400).json({ message: 'Auction has ended or is no longer active' });
        return;
      }

      if (freshCar.currentBid >= amount) {
        res.status(409).json({
          message: `Outbid! Another bidder placed a bid of $${freshCar.currentBid.toLocaleString()} before your request arrived.`,
          currentBid: freshCar.currentBid,
        });
        return;
      }

      res.status(400).json({ message: 'Bid placement failed due to a state conflict. Please try again.' });
      return;
    }

    // 4. Find previous active bid to notify outbid user
    const previousActiveBid = await Bid.findOne({ carId, status: 'active' });
    if (previousActiveBid && String(previousActiveBid.userId) !== req.user!.sub) {
      const prevUserIdStr = String(previousActiveBid.userId);
      const outbidNotif = await Notification.create({
        userId: prevUserIdStr,
        type: 'outbid',
        carId,
        message: `You were outbid on ${existingCar.year} ${existingCar.make} ${existingCar.model}! Current highest bid is now $${amount.toLocaleString()}.`,
      });

      try {
        getIO().to(`user:${prevUserIdStr}`).emit('notification:new', {
          _id: String(outbidNotif._id),
          userId: prevUserIdStr,
          type: outbidNotif.type,
          carId,
          message: outbidNotif.message,
          read: outbidNotif.read,
          createdAt: outbidNotif.createdAt.toISOString(),
        });
      } catch {
        // Non-blocking if socket emit fails
      }
    }

    // Update status of previous active bids for this car to 'outbid'
    await Bid.updateMany(
      { carId, status: 'active' },
      { $set: { status: 'outbid' } },
    );

    // 5. Create new winning active bid
    const newBid = await Bid.create({
      carId,
      userId: req.user!.sub,
      amount,
      status: 'active',
    });

    // 6. ANTI-SNIPING RULE: If bid arrives in last 60 seconds, extend auctionEnd by +2 minutes
    const timeRemainingMs = updatedCar.auctionEnd.getTime() - Date.now();
    let wasExtended = false;

    if (timeRemainingMs > 0 && timeRemainingMs < 60 * 1000) {
      const extendedEnd = new Date(updatedCar.auctionEnd.getTime() + 120 * 1000);
      const extendedResult = await Car.findOneAndUpdate(
        { _id: carId },
        { $set: { auctionEnd: extendedEnd } },
        { new: true },
      );
      if (extendedResult) {
        updatedCar = extendedResult;
        wasExtended = true;
      }
    }

    const formattedBid = {
      _id: String(newBid._id),
      carId: String(carId),
      userId: String(req.user!.sub),
      amount: newBid.amount,
      status: newBid.status,
      maskedBidderName: maskName(req.user!.name),
      createdAt: newBid.createdAt.toISOString(),
    };

    // 7. REAL-TIME BROADCASTS VIA SOCKET.IO
    try {
      const io = getIO();

      if (wasExtended) {
        io.to(carId).emit('auction:extended', {
          carId,
          newAuctionEnd: updatedCar.auctionEnd.toISOString(),
          extendedBySeconds: 120,
          serverTime: Date.now(),
        });
      }

      io.to(carId).emit('bid:placed', {
        carId,
        currentBid: updatedCar.currentBid,
        bidCount: updatedCar.bidCount,
        newBid: formattedBid,
        auctionEnd: updatedCar.auctionEnd.toISOString(),
        serverTime: Date.now(),
      });
    } catch {
      // Non-blocking if socket broadcast fails
    }

    res.status(201).json({
      message: 'Bid placed successfully!',
      bid: formattedBid,
      car: updatedCar,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place bid', error });
  }
});

// ─── GET /api/cars/:id/bids ───────────────────────────────────────────────────
// Paginated bid history for a vehicle listing (newest first, masked names for privacy)
router.get('/cars/:id/bids', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: carId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const [bids, total] = await Promise.all([
      Bid.find({ carId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name'),
      Bid.countDocuments({ carId }),
    ]);

    const formattedBids = bids.map((b) => {
      const userObj = b.userId as unknown as { name?: string };
      const rawName = userObj?.name || 'Anonymous';
      return {
        _id: b._id,
        carId: b.carId,
        userId: b.userId,
        amount: b.amount,
        status: b.status,
        maskedBidderName: maskName(rawName),
        createdAt: b.createdAt,
      };
    });

    res.status(200).json({
      bids: formattedBids,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bid history', error });
  }
});

// ─── GET /api/users/me/bids ───────────────────────────────────────────────────
// Get current user's bids across cars (for dashboard)
router.get('/users/me/bids', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const bids = await Bid.find({ userId: req.user!.sub })
      .sort({ createdAt: -1 })
      .populate('carId');

    res.status(200).json(bids);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user's bids", error });
  }
});

export default router;
