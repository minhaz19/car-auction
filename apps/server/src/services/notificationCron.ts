import { Car } from '../models/Car';
import { Bid } from '../models/Bid';
import { User } from '../models/User';
import { Notification } from '../models/Notification';
import { Transaction } from '../models/Transaction';
import { stripe } from '../config/stripe';
import { getIO } from '../socket';

// Track ending-soon notifications sent to prevent duplicate spam
const notifiedEndingSoonCarIds = new Set<string>();

export function startNotificationCron() {
  // Run every 30 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      const fiveMinsFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // 1. CHECK FOR AUCTIONS ENDING WITHIN 5 MINUTES
      const endingSoonCars = await Car.find({
        status: 'live',
        auctionEnd: { $gt: now, $lte: fiveMinsFromNow },
      });

      for (const car of endingSoonCars) {
        const carIdStr = String(car._id);
        if (notifiedEndingSoonCarIds.has(carIdStr)) continue;

        notifiedEndingSoonCarIds.add(carIdStr);

        // Find watchers and active bidders for this car
        const [watchers, activeBids] = await Promise.all([
          User.find({ watchlist: car._id }).select('_id'),
          Bid.find({ carId: car._id }).distinct('userId'),
        ]);

        const recipientUserIds = new Set<string>([
          ...watchers.map((w) => String(w._id)),
          ...activeBids.map((b) => String(b)),
        ]);

        for (const userId of recipientUserIds) {
          const notification = await Notification.create({
            userId,
            type: 'ending-soon',
            carId: car._id,
            message: `Auction for ${car.year} ${car.make} ${car.model} is ending in less than 5 minutes!`,
          });

          try {
            getIO().to(`user:${userId}`).emit('notification:new', {
              _id: String(notification._id),
              userId,
              type: notification.type,
              carId: String(car._id),
              message: notification.message,
              read: notification.read,
              createdAt: notification.createdAt.toISOString(),
            });
          } catch {
            // Ignore socket failure
          }
        }
      }

      // 2. CHECK FOR AUCTIONS THAT RECENTLY ENDED
      const expiredCars = await Car.find({
        status: 'live',
        auctionEnd: { $lte: now },
      });

      for (const car of expiredCars) {
        car.status = 'ended';
        await car.save();

        // Broadcast auction:ended to room
        try {
          getIO().to(String(car._id)).emit('auction:ended', {
            carId: String(car._id),
            winningBid: car.currentBid,
            serverTime: Date.now(),
          });
        } catch {
          // Ignore socket failure
        }

        // Get winning bid and outbid participants
        const winningBid = await Bid.findOne({ carId: car._id, status: 'active' })
          .sort({ amount: -1 })
          .populate('userId', 'name');

        // Check reserve price constraint if set
        const reserveMet = !car.reservePrice || car.currentBid >= car.reservePrice;

        if (winningBid && reserveMet) {
          winningBid.status = 'won';
          await winningBid.save();

          const winnerId = String(winningBid.userId);

          // Create Transaction record for payment checkout
          const transaction = await Transaction.create({
            carId: car._id,
            buyerId: winnerId,
            sellerId: car.sellerId,
            amount: car.currentBid,
            status: 'pending',
            payoutStatus: 'pending',
          });

          // Attempt to create Stripe PaymentIntent
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(car.currentBid * 100),
              currency: 'usd',
              metadata: {
                transactionId: String(transaction._id),
                carId: String(car._id),
                buyerId: winnerId,
              },
            });
            transaction.stripePaymentIntentId = paymentIntent.id;
            await transaction.save();
          } catch {
            // Non-blocking in dev if secret key missing
          }

          const winnerNotif = await Notification.create({
            userId: winnerId,
            type: 'won',
            carId: car._id,
            message: `Congratulations! You won the auction for ${car.year} ${car.make} ${car.model} with a bid of $${car.currentBid.toLocaleString()}! Complete your checkout to finalize purchase.`,
          });

          try {
            getIO().to(`user:${winnerId}`).emit('notification:new', {
              _id: String(winnerNotif._id),
              userId: winnerId,
              type: winnerNotif.type,
              carId: String(car._id),
              message: winnerNotif.message,
              read: winnerNotif.read,
              createdAt: winnerNotif.createdAt.toISOString(),
            });
          } catch {
            // Ignore socket failure
          }
        }

        // Notify other bidders that they lost
        const lostBids = await Bid.find({ carId: car._id, status: 'outbid' }).distinct('userId');
        for (const userId of lostBids) {
          const userIdStr = String(userId);
          if (winningBid && userIdStr === String(winningBid.userId)) continue;

          const lostNotif = await Notification.create({
            userId: userIdStr,
            type: 'lost',
            carId: car._id,
            message: `The auction for ${car.year} ${car.make} ${car.model} has closed. Final winning bid: $${car.currentBid.toLocaleString()}.`,
          });

          try {
            getIO().to(`user:${userIdStr}`).emit('notification:new', {
              _id: String(lostNotif._id),
              userId: userIdStr,
              type: lostNotif.type,
              carId: String(car._id),
              message: lostNotif.message,
              read: lostNotif.read,
              createdAt: lostNotif.createdAt.toISOString(),
            });
          } catch {
            // Ignore socket failure
          }
        }
      }
    } catch (err) {
      console.error('Error running notification background service:', err);
    }
  }, 30000);
}
