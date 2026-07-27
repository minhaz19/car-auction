import { Router, Request, Response, IRouter } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Car } from '../models/Car';
import { Transaction } from '../models/Transaction';
import { requireAuth, requireRole } from '../middleware/auth';

const router: IRouter = Router();

// Protect all admin endpoints
router.use(requireAuth, requireRole('admin'));

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────
router.get('/analytics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalActiveAuctions,
      totalUsers,
      statusCounts,
      volumeAgg,
      topBrandsAgg,
    ] = await Promise.all([
      Car.countDocuments({ status: 'live' }),
      User.countDocuments(),
      Car.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Car.aggregate([
        {
          $group: {
            _id: null,
            totalVolume: { $sum: '$currentBid' },
          },
        },
      ]),
      Car.aggregate([
        {
          $group: {
            _id: '$make',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const listingsByStatus = {
      live: 0,
      ended: 0,
      upcoming: 0,
    };

    statusCounts.forEach((sc: { _id: string; count: number }) => {
      if (sc._id === 'live') listingsByStatus.live = sc.count;
      if (sc._id === 'ended') listingsByStatus.ended = sc.count;
      if (sc._id === 'upcoming') listingsByStatus.upcoming = sc.count;
    });

    const totalBidVolume = volumeAgg[0]?.totalVolume || 0;
    const topBrands = topBrandsAgg.map((tb: { _id: string; count: number }) => ({
      brand: tb._id,
      count: tb.count,
    }));

    res.status(200).json({
      totalActiveAuctions,
      totalBidVolume,
      totalUsers,
      listingsByStatus,
      topBrands,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to compute admin analytics', error });
  }
});

// ─── GET /api/admin/cars ──────────────────────────────────────────────────────
router.get('/cars', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, sellerId, search } = req.query;

    const filter: Record<string, unknown> = {};
    if (status && typeof status === 'string') {
      filter.status = status;
    }
    if (sellerId && typeof sellerId === 'string' && mongoose.Types.ObjectId.isValid(sellerId)) {
      filter.sellerId = sellerId;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const cars = await Car.find(filter)
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email role status');

    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin listings', error });
  }
});

// ─── PATCH /api/admin/cars/:id/status ────────────────────────────────────────
router.patch('/cars/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !reason) {
      res.status(400).json({ message: 'status and reason are required' });
      return;
    }

    if (!['live', 'ended', 'upcoming'].includes(status)) {
      res.status(400).json({ message: 'Invalid listing status' });
      return;
    }

    const car = await Car.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    ).populate('sellerId', 'name email');

    if (!car) {
      res.status(404).json({ message: 'Car listing not found' });
      return;
    }

    res.status(200).json({
      message: `Listing status updated to ${status}. Reason: ${reason}`,
      car,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update car listing status', error });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find()
      .select('name email role status createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users list', error });
  }
});

// ─── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
router.patch('/users/:id/suspend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      res.status(400).json({ message: 'status must be "active" or "suspended"' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    ).select('name email role status createdAt');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: `User status updated to ${status}`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user suspension status', error });
  }
});

// ─── GET /api/admin/disputes ──────────────────────────────────────────────────
router.get('/disputes', async (_req: Request, res: Response): Promise<void> => {
  try {
    const disputes = await Transaction.find({
      $or: [{ status: 'disputed' }, { disputed: true }],
    })
      .sort({ updatedAt: -1 })
      .populate('carId', 'make model year images currentBid')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    res.status(200).json(disputes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin disputes', error });
  }
});

// ─── PATCH /api/admin/disputes/:id/resolve ────────────────────────────────────
router.patch('/disputes/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;

    if (!resolutionNotes || !resolutionNotes.trim()) {
      res.status(400).json({ message: 'resolutionNotes is required' });
      return;
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      {
        $set: {
          disputed: false,
          disputeReason: `RESOLVED by Admin: ${resolutionNotes.trim()}`,
          status: 'completed',
          fulfillmentStatus: 'completed',
        },
      },
      { new: true },
    )
      .populate('carId', 'make model year')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!transaction) {
      res.status(404).json({ message: 'Disputed transaction not found' });
      return;
    }

    res.status(200).json({
      message: 'Dispute resolved successfully',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resolve dispute', error });
  }
});

export default router;
