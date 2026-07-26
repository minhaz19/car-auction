import { Router, Request, Response, IRouter } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { stripe } from '../config/stripe';
import { Transaction } from '../models/Transaction';
import { Car } from '../models/Car';
import { Notification } from '../models/Notification';
import { getIO } from '../socket';

const router: IRouter = Router();

// Raw body parser for Stripe webhook signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
      } else {
        // Fallback for local testing without webhook secret configured
        event = JSON.parse((req.body as Buffer).toString()) as Stripe.Event;
      }
    } catch (err) {
      res.status(400).send(`Webhook Signature Error: ${(err as Error).message}`);
      return;
    }

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const transactionId = paymentIntent.metadata?.transactionId;

      try {
        let transaction = null;
        if (transactionId) {
          transaction = await Transaction.findById(transactionId);
        } else {
          transaction = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id });
        }

        if (transaction && transaction.status !== 'paid') {
          // Source of truth update
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
            message: `Stripe webhook confirmed payment of $${transaction.amount.toLocaleString()} for your auction listing!`,
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
        }
      } catch (err) {
        console.error('Failed to process Stripe webhook payment_intent.succeeded:', err);
      }
    }

    res.status(200).json({ received: true });
  },
);

export default router;
