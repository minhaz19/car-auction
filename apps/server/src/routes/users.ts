import { Router, Request, Response, IRouter } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { Review } from '../models/Review';
import { requireAuth } from '../middleware/auth';

const router: IRouter = Router();

// ─── WATCHLIST ENDPOINTS ──────────────────────────────────────────────────────

// GET /api/users/me/watchlist
router.get('/me/watchlist', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.sub).populate({
      path: 'watchlist',
      select: 'make model year condition currentBid startingBid auctionEnd status images mileage bodyType',
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user.watchlist || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch watchlist', error });
  }
});

// POST /api/users/me/watchlist/:carId
router.post('/me/watchlist/:carId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { carId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      res.status(400).json({ message: 'Invalid car ID format' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      req.user!.sub,
      { $addToSet: { watchlist: carId } },
      { new: true },
    );

    res.status(200).json({
      message: 'Vehicle added to watchlist',
      watchlist: user?.watchlist || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add to watchlist', error });
  }
});

// DELETE /api/users/me/watchlist/:carId
router.delete('/me/watchlist/:carId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { carId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user!.sub,
      { $pull: { watchlist: carId } },
      { new: true },
    );

    res.status(200).json({
      message: 'Vehicle removed from watchlist',
      watchlist: user?.watchlist || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove from watchlist', error });
  }
});

// ─── NOTIFICATION ENDPOINTS ───────────────────────────────────────────────────

// GET /api/users/me/notifications
router.get('/me/notifications', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('carId', 'make model year images'),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false }),
    ]);

    res.status(200).json({
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error });
  }
});

// PATCH /api/users/me/notifications/:id/read
router.patch('/me/notifications/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user!.sub },
      { $set: { read: true } },
      { new: true },
    );

    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark notification read', error });
  }
});

// PATCH /api/users/me/notifications/read-all
router.patch('/me/notifications/read-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId: req.user!.sub, read: false },
      { $set: { read: true } },
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark all notifications read', error });
  }
});

// ─── PUBLIC USER REVIEWS & RATING BADGE ENDPOINT ──────────────────────────────

// GET /api/users/:id/reviews
router.get('/:id/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const reviews = await Review.find({ revieweeId: id })
      .sort({ createdAt: -1 })
      .populate('reviewerId', 'name')
      .populate('carId', 'make model year');

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    res.status(200).json({
      reviews,
      averageRating,
      totalReviews,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user reviews', error });
  }
});

export default router;
