import 'dotenv/config';
import http from 'http';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './db/connection';
import authRouter from './routes/auth';
import metaRouter from './routes/meta';
import carsRouter from './routes/cars';
import bidsRouter from './routes/bids';
import usersRouter from './routes/users';
import transactionsRouter from './routes/transactions';
import reviewsRouter from './routes/reviews';
import adminRouter from './routes/admin';
import webhooksRouter from './routes/webhooks';
import { initSocketServer } from './socket';
import { startNotificationCron } from './services/notificationCron';

const app: Application = express();
const PORT = process.env.PORT || 5001;
const httpServer = http.createServer(app);

// Initialize Socket.io real-time engine
initSocketServer(httpServer);

// ─── Webhook Mount (Raw body parsing BEFORE express.json()) ──────────────────
app.use('/api/webhooks', webhooksRouter);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS: allow Next.js dev server and production origin
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_ORIGIN || 'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman) in development
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/meta', metaRouter);
app.use('/api/cars', carsRouter);
app.use('/api/users', usersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/admin', adminRouter);
app.use('/api', bidsRouter);

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });

  // Connect to MongoDB after server is listening so HTTP is always reachable
  await connectDB();

  // Start background notification cron runner
  startNotificationCron();
}

start();

export default app;
