import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './db/connection';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: allow Next.js dev server and production origin
app.use(
  cors({
    origin: [
      'http://localhost:3000', // Next.js dev
      process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    ],
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

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });

  // Connect to MongoDB after server is listening so HTTP is always reachable
  await connectDB();
}

start();

export default app;
