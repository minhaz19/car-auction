# Car Auction Platform

A full-stack, real-time car auction platform built with Next.js, Express.js, MongoDB, and Socket.io. Users can browse and search vehicle listings, place live bids in a real-time auction room, and sellers can create and manage listings. The platform features concurrency-safe bidding with MongoDB transactions/optimistic locking, anti-sniping auto-extension logic, server-authoritative countdown timers, and a secure JWT access + refresh token auth flow with httpOnly cookie storage and session revocation — all built to be defensible in engineering interviews.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend | Express.js (REST API), TypeScript |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT access + refresh tokens, httpOnly cookies |
| File storage | Cloudinary / S3 (for car images) |
| Payments | Stripe (test mode) |
| Monorepo | Bun workspaces |
| Deployment | Vercel (web) + Render/Railway (server) |
| Testing | Vitest + Playwright |

---

## Project Structure

```
car-auction/
├── apps/
│   ├── web/       # Next.js 16 App Router frontend
│   └── server/    # Express.js REST API + Socket.io backend
├── packages/
│   └── shared/    # Shared TypeScript types (populated in later phases)
├── .github/
│   └── workflows/
│       └── ci.yml
├── REQUIREMENTS.md
├── DECISIONS.md
├── PHASES.md
├── API.md
└── README.md
```

---

## How to Run Locally

### Prerequisites
- [Bun](https://bun.sh) v1.1+
- MongoDB running locally or a MongoDB Atlas connection string

### 1. Install dependencies (from repo root)

```bash
bun install
```

### 2. Configure the server environment

```bash
cp apps/server/.env.example apps/server/.env
# Then edit apps/server/.env with your actual MONGODB_URI and JWT secrets
```

### 3. Start the Next.js frontend

```bash
bun run dev:web
# → http://localhost:3000
```

### 4. Start the Express backend

```bash
bun run dev:server
# → http://localhost:5001
# Health check: http://localhost:5001/api/health
```

### 5. Verify the health check

```bash
curl http://localhost:5001/api/health
# Expected: { "status": "ok", "timestamp": "...", "uptime": ... }
```

---

## Scripts (root)

| Command | Description |
|---|---|
| `bun install` | Install all workspace dependencies |
| `bun run dev:web` | Start Next.js dev server |
| `bun run dev:server` | Start Express server with file watch |
| `bun run lint` | Lint both apps |
| `bun run typecheck` | Typecheck both apps |
| `bun run format` | Format all files with Prettier |
