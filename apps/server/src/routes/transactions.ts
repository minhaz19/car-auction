import { Router, Request, Response, IRouter } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Car } from '../models/Car';
import { Bid } from '../models/Bid';
import { Message } from '../models/Message';
import { Review } from '../models/Review';
import { Notification } from '../models/Notification';
import { requireAuth } from '../middleware/auth';
import { stripe, STRIPE_PUBLISHABLE_KEY } from '../config/stripe';
import { getIO } from '../socket';

const router: IRouter = Router();

// ─── GET /api/transactions/me ──────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.sub;

    // Auto-create missing transactions for ended auctions where user was highest bidder
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
              fulfillmentStatus: 'pending_payment',
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
      .populate('carId', 'make model year images condition currentBid startingBid status')
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

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

    if (transaction.status === 'paid' || transaction.status === 'awaiting_handoff' || transaction.status === 'completed') {
      res.status(400).json({ message: 'Transaction is already paid' });
      return;
    }

    let clientSecret = '';

    if (transaction.stripePaymentIntentId) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
        clientSecret = existingIntent.client_secret || '';
      } catch {
        // Fallback
      }
    }

    if (!clientSecret) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(transaction.amount * 100),
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

    // Mark paid & transition to awaiting_handoff
    transaction.status = 'awaiting_handoff';
    transaction.fulfillmentStatus = 'paid_awaiting_pickup';
    transaction.paidAt = new Date();
    await transaction.save();

    await Car.findByIdAndUpdate(transaction.carId, { $set: { status: 'ended' } });

    // Notify seller
    const sellerIdStr = String(transaction.sellerId);
    const sellerNotif = await Notification.create({
      userId: sellerIdStr,
      type: 'won',
      carId: transaction.carId,
      message: `Payment confirmed! Transaction moved to awaiting handoff. Contact details revealed for pickup coordination.`,
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
      // Ignore socket error
    }

    res.status(200).json({
      message: 'Payment confirmed successfully. Transaction is now awaiting handoff.',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm payment', error });
  }
});

// ─── GET /api/transactions/:id/messages ──────────────────────────────────────
router.get('/:id/messages', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const buyerIdStr = String(transaction.buyerId);
    const sellerIdStr = String(transaction.sellerId);

    if (req.user!.sub !== buyerIdStr && req.user!.sub !== sellerIdStr && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized to view messages for this transaction' });
      return;
    }

    const messages = await Message.find({ transactionId: id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email');

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transaction messages', error });
  }
});

// ─── POST /api/transactions/:id/messages ─────────────────────────────────────
router.post('/:id/messages', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: 'Message text is required' });
      return;
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const buyerIdStr = String(transaction.buyerId);
    const sellerIdStr = String(transaction.sellerId);

    if (req.user!.sub !== buyerIdStr && req.user!.sub !== sellerIdStr && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized to send message on this transaction' });
      return;
    }

    const messageDoc = await Message.create({
      transactionId: id,
      senderId: req.user!.sub,
      text: text.trim(),
    });

    const populatedMsg = await Message.findById(messageDoc._id).populate('senderId', 'name email');

    // Broadcast message:new to transaction socket room
    try {
      getIO().to(`transaction:${id}`).emit('message:new' as unknown as keyof import('@car-auction/shared').ServerToClientEvents, populatedMsg as unknown as never);
    } catch {
      // Socket fail safe
    }

    res.status(201).json(populatedMsg);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error });
  }
});

// ─── PATCH /api/transactions/:id/confirm-handoff ─────────────────────────────
// Mutual confirmation endpoint for buyer & seller
router.patch('/:id/confirm-handoff', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const buyerIdStr = String(transaction.buyerId);
    const sellerIdStr = String(transaction.sellerId);
    const userId = req.user!.sub;

    if (userId !== buyerIdStr && userId !== sellerIdStr && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized to confirm handoff' });
      return;
    }

    if (userId === buyerIdStr || req.user!.role === 'admin') {
      transaction.handoffConfirmedByBuyer = true;
    }
    if (userId === sellerIdStr || req.user!.role === 'admin') {
      transaction.handoffConfirmedBySeller = true;
    }

    let isFullyCompleted = false;

    // Check if both parties have confirmed
    if (transaction.handoffConfirmedByBuyer && transaction.handoffConfirmedBySeller) {
      transaction.status = 'completed';
      transaction.fulfillmentStatus = 'completed';
      transaction.payoutStatus = 'initiated';
      transaction.completedAt = new Date();
      isFullyCompleted = true;

      // Update car status to sold
      await Car.findByIdAndUpdate(transaction.carId, { $set: { status: 'ended' } });

      // Notify both parties
      const completionMsg = `Vehicle handoff confirmed by both parties! Transaction completed and seller payout initiated.`;
      
      const buyerNotif = await Notification.create({
        userId: buyerIdStr,
        type: 'won',
        carId: transaction.carId,
        message: completionMsg,
      });

      const sellerNotif = await Notification.create({
        userId: sellerIdStr,
        type: 'won',
        carId: transaction.carId,
        message: completionMsg,
      });

      try {
        getIO().to(`user:${buyerIdStr}`).emit('notification:new', {
          _id: String(buyerNotif._id),
          userId: buyerIdStr,
          type: buyerNotif.type,
          carId: String(transaction.carId),
          message: buyerNotif.message,
          read: buyerNotif.read,
          createdAt: buyerNotif.createdAt.toISOString(),
        });

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
        // Socket fail safe
      }
    }

    await transaction.save();

    res.status(200).json({
      message: isFullyCompleted
        ? 'Handoff confirmed by both parties! Transaction is now fully completed.'
        : 'Handoff confirmed. Awaiting counterpart confirmation.',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm handoff', error });
  }
});

// ─── PATCH /api/transactions/:id/dispute ──────────────────────────────────────
router.patch('/:id/dispute', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const buyerIdStr = String(transaction.buyerId);
    const sellerIdStr = String(transaction.sellerId);

    if (req.user!.sub !== buyerIdStr && req.user!.sub !== sellerIdStr && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized to open dispute' });
      return;
    }

    transaction.status = 'disputed';
    transaction.disputed = true;
    transaction.disputeReason = reason || 'Dispute raised regarding vehicle handoff condition or paperwork.';
    transaction.fulfillmentStatus = 'disputed';
    transaction.disputedAt = new Date();
    await transaction.save();

    res.status(200).json({
      message: 'Dispute submitted. Customer compliance support will review within 24 hours.',
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit dispute', error });
  }
});

// ─── POST /api/transactions/:id/review ───────────────────────────────────────
router.post('/:id/review', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      res.status(400).json({ message: 'rating and comment are required' });
      return;
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      return;
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const buyerIdStr = String(transaction.buyerId);
    const sellerIdStr = String(transaction.sellerId);
    const userId = req.user!.sub;

    if (userId !== buyerIdStr && userId !== sellerIdStr && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized to submit review for this transaction' });
      return;
    }

    if (transaction.status !== 'completed') {
      res.status(400).json({ message: 'Reviews can only be submitted after transaction handoff is completed' });
      return;
    }

    // Determine reviewer and reviewee
    const revieweeId = userId === buyerIdStr ? sellerIdStr : buyerIdStr;

    // Check if already reviewed
    const existingReview = await Review.findOne({ transactionId: id, reviewerId: userId });
    if (existingReview) {
      res.status(400).json({ message: 'You have already submitted a review for this transaction' });
      return;
    }

    const review = await Review.create({
      transactionId: id,
      carId: transaction.carId,
      reviewerId: userId,
      revieweeId,
      rating: numericRating,
      comment: comment.trim(),
    });

    res.status(201).json({
      message: 'Review submitted successfully!',
      review,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit review', error });
  }
});

export default router;
