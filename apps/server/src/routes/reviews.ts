import { Router, Request, Response, IRouter } from 'express';
import mongoose from 'mongoose';
import { Review } from '../models/Review';
import { Transaction } from '../models/Transaction';
import { requireAuth } from '../middleware/auth';

const router: IRouter = Router();

// ─── POST /api/reviews ────────────────────────────────────────────────────────
// Submit a verified post-transaction review (buyer only, completed transactions)
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId, rating, comment } = req.body;

    if (!transactionId || !rating || !comment) {
      res.status(400).json({ message: 'transactionId, rating, and comment are required' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      res.status(400).json({ message: 'Invalid transaction ID' });
      return;
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      return;
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Verify requesting user is the winning buyer
    if (String(transaction.buyerId) !== req.user!.sub) {
      res.status(403).json({ message: 'Only verified winning buyers can submit seller reviews' });
      return;
    }

    // Verify transaction is completed
    if (transaction.status !== 'completed' && transaction.fulfillmentStatus !== 'completed') {
      res.status(400).json({
        message: 'Reviews can only be submitted after vehicle handoff is completed',
      });
      return;
    }

    // Check if review already submitted
    const existingReview = await Review.findOne({
      transactionId: transaction._id,
      reviewerId: req.user!.sub,
    });

    if (existingReview) {
      res.status(400).json({ message: 'You have already submitted a review for this transaction' });
      return;
    }

    const review = await Review.create({
      transactionId: transaction._id,
      carId: transaction.carId,
      reviewerId: req.user!.sub,
      sellerId: transaction.sellerId,
      rating: numericRating,
      comment: comment.trim(),
    });

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review', error });
  }
});

// ─── GET /api/reviews/seller/:sellerId ────────────────────────────────────────
// Retrieve all verified reviews for a specific seller
router.get('/seller/:sellerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      res.status(400).json({ message: 'Invalid seller ID' });
      return;
    }

    const reviews = await Review.find({ sellerId })
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
    res.status(500).json({ message: 'Failed to fetch seller reviews', error });
  }
});

export default router;
