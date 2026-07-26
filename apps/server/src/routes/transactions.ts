import { Router, Request, Response, IRouter } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Car } from '../models/Car';
import { Bid } from '../models/Bid';
import { Notification } from '../models/Notification';
import { requireAuth } from '../middleware/auth';
import { stripe, STRIPE_PUBLISHABLE_KEY } from '../config/stripe';
import { getIO } from '../socket';

const router: IRouter = Router();

// ─── GET /api/transactions/me ──────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;

    // Auto-create missing transactions for any ended auctions where user was highest bidder
    const endedCars = await Car.find({ status: 'ended' });
    for (const car of endedCars) {
      const topBid = await Bid.findOne({ carId: car._id }).sort({ amount: -1 });
      if (topBid) {
        const topBidUserIdStr =
          typeof topBid.userId === 'object' && topBid.userId !== null && '_id' in topBid.userId
            ? String((topBid.userId as { _id: unknown })._id)
            : String(topBid.userId);

        if (topBidUserIdStr === userId) {
          const existingTx = await Transaction.findOne({ carId: car._id });
          if (!existingTx) {
            const newTx = await Transaction.create({
              carId: car._id,
              buyerId: userId,
              sellerId: car.sellerId,
              amount: car.currentBid,
              status: 'pending',
              payoutStatus: 'pending',
            });

            try {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(car.currentBid * 100),
                currency: 'usd',
                metadata: {
                  transactionId: String(newTx._id),
                  carId: String(car._id),
                  buyerId: userId,
                },
              });
              newTx.stripePaymentIntentId = paymentIntent.id;
              await newTx.save();
            } catch {
              // Dev mock fallback
            }

            topBid.status = 'won';
            await topBid.save();
          }
        }
      }
    }

    const transactions = await Transaction.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('carId', 'make model year images condition currentBid startingBid status');

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user transactions', error });
  }
});

// ─── GET /api/transactions/:id ────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid transaction ID' });
      return;
    }

    const transaction = await Transaction.findById(id)
      .populate('carId', 'make model year images condition currentBid startingBid status')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Verify requesting user is buyer, seller, or admin
    const buyerIdStr = String((transaction.buyerId as unknown as { _id: string })._id || transaction.buyerId);
    const sellerIdStr = String((transaction.sellerId as unknown as { _id: string })._id || transaction.sellerId);

    if (req.user!.sub !== buyerIdStr && req.user!.sub !== sellerIdStr && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized to view this transaction' });
      return;
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transaction details', error });
  }
});

// ─── POST /api/transactions/:id/create-payment-intent ────────────────────────
router.post('/:id/create-payment-intent', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (String(transaction.buyerId) !== req.user!.sub) {
      res.status(403).json({ message: 'Only the winning buyer can initiate payment' });
      return;
    }

    if (transaction.status === 'paid') {
      res.status(400).json({ message: 'Transaction is already paid' });
      return;
    }

    let clientSecret = '';

    // If PaymentIntent exists on Stripe, retrieve its client secret
    if (transaction.stripePaymentIntentId) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
        clientSecret = existingIntent.client_secret || '';
      } catch {
        // Fallback to create new intent if secret key changed or mock
      }
    }

    // Create PaymentIntent if not exists or failed to retrieve
    if (!clientSecret) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(transaction.amount * 100), // convert to cents
          currency: 'usd',
          metadata: {
            transactionId: String(transaction._id),
            carId: String(transaction.carId),
            buyerId: String(transaction.buyerId),
          },
        });

        transaction.stripePaymentIntentId = paymentIntent.id;
        await transaction.save();

        clientSecret = paymentIntent.client_secret || '';
      } catch {
        // Fallback secret for offline / test mock mode
        clientSecret = `mock_secret_${transaction._id}_secret_testKey`;
      }
    }

    res.status(200).json({
      clientSecret,
      stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
      amount: transaction.amount,
      status: transaction.status,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment intent', error });
  }
});

// ─── POST /api/transactions/:id/confirm ───────────────────────────────────────
// Client-side confirmation endpoint (UX responsiveness trigger)
router.post('/:id/confirm', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (String(transaction.buyerId) !== req.user!.sub) {
      res.status(403).json({ message: 'Unauthorized to confirm payment' });
      return;
    }

    // Mark transaction paid & car sold
    transaction.status = 'paid';
    transaction.paidAt = new Date();
    await transaction.save();

    await Car.findByIdAndUpdate(transaction.carId, { $set: { status: 'ended' } });

    // Notify seller
    const sellerIdStr = String(transaction.sellerId);
    const sellerNotif = await Notification.create({
      userId: sellerIdStr,
      type: 'won',
      carId: transaction.carId,
      message: `Payment confirmed for your vehicle auction! Payout status: Processing (Stripe Connect integration planned).`,
    });

    try {
      getIO().to(`user:${sellerIdStr}`).emit('notification:new', {
        _id: String(sellerNotif._id),
        userId: sellerIdStr,
        type: sellerNotif.type,
        carId: String(transaction.carId),
        message: sellerNotif.message,
        read: sellerNotif.read,
        createdAt: sellerNotif.createdAt.toISOString(),
      });
    } catch {
      // Ignore socket failure
    }

    res.status(200).json({
      message: 'Payment confirmed successfully',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm payment', error });
  }
});

export default router;
