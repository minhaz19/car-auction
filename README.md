# RevBid — Live Car Auctions & Real-Time Bidding Platform

RevBid is a production-ready, full-stack automotive live auction platform engineered with **Next.js 16 (App Router)**, **Express.js**, **Socket.io**, **MongoDB (Mongoose)**, and **Stripe Test Payments**.

The platform is designed to emulate high-volume automotive marketplaces (such as *Bring a Trailer* and *Cars & Bids*), featuring concurrency-safe atomic bidding (`findOneAndUpdate` with `$lt` currentBid), anti-sniping auto-extension logic (+2 min on last-minute bids), server-authoritative countdown timers, real-time presence indicators, Stripe Elements payment checkout, mutual handoff confirmation, transaction-scoped chat threads, verified seller rating badges, and a MongoDB-backed admin moderation panel.

---

## 🌐 Live Deployments & Demo Links

- **Frontend App (Vercel):** [https://revbid.vercel.app](https://revbid.vercel.app)
- **Backend API & WebSockets (Render / Railway):** [https://revbid-api.onrender.com](https://revbid-api.onrender.com)
- **API Health Check:** `GET https://revbid-api.onrender.com/api/health`

---

## 🔐 Pre-configured Demo Accounts

Run `bun run --cwd apps/server seed` to populate sample vehicle inventory and pre-configured accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@revbid.com` | `AdminPass123!` | Analytics, Moderation, User Suspension, Dispute Adjudication |
| **Seller** | `seller@revbid.dev` | `Password123!` | Create & Manage Vehicle Listings, Accept Handoff |
| **Buyer** | `buyer@revbid.dev` | `Password123!` | Place Live Bids, Watchlist, Stripe Checkout, Submit Reviews |

---

## 🛠️ Complete Tech Stack & Architecture

| Tier | Technology | Purpose & Implementation Details |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + React 19 | Server & Client Components, dynamic code-splitting (`next/dynamic`), `next/font` zero-FOUT typography (`Inter` + `JetBrains Mono`) |
| **Styling** | Vanilla CSS Tokens + Tailwind CSS v4 | Near-black dark design system (`#121212` background, `#10B981` Emerald accent), Sofascore sports-ticker inspired bid displays |
| **State Management** | Redux Toolkit & RTK Query | Cache invalidation, tag management (`carsApi`, `transactionsApi`, `usersApi`, `adminApi`) |
| **Backend API** | Express.js REST API | Modular TypeScript routers (`/api/auth`, `/api/cars`, `/api/transactions`, `/api/reviews`, `/api/admin`) |
| **Real-Time Engine** | Socket.io v4 | Transaction & auction room presence tracking, live bid broadcast, anti-sniping extension events (`auction:extended`) |
| **Database** | MongoDB (Mongoose 8) | Schema validation, compound unique indices, MongoDB Aggregation pipelines for admin analytics |
| **Payments** | Stripe API (`@stripe/stripe-js`) | `PaymentIntent` server initialization, Stripe Elements payment form, signature-verified webhooks (`POST /api/webhooks/stripe`) |
| **Monorepo Scaffolding** | Bun Workspaces | Shared TypeScript type definitions package (`@car-auction/shared`) |

---

## 🚀 How to Run Locally

### Prerequisites
- [Bun](https://bun.sh) v1.1+ installed
- MongoDB instance running locally (`mongodb://localhost:27017/car-auction`) or a MongoDB Atlas connection string

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/car-auction.git
cd car-auction
bun install
```

### 2. Build Shared Package

```bash
bun run --cwd packages/shared build
```

### 3. Configure Environment Variables

Create `.env` in `apps/server` and `.env.local` in `apps/web`:

```bash
# Server Environment
cp apps/server/.env.example apps/server/.env

# Web Environment
cp apps/web/.env.example apps/web/.env.local
```

### 4. Seed Database

```bash
bun run --cwd apps/server seed
```

### 5. Start Development Servers

Run both servers concurrently:

```bash
# Terminal 1: Next.js Frontend (http://localhost:3000)
bun run dev:web

# Terminal 2: Express Backend (http://localhost:5001)
bun run dev:server
```

---

## ⚙️ Environment Variables Audit

### Server (`apps/server/.env`)
- `PORT`: HTTP server port (Default: `5001`)
- `NODE_ENV`: Runtime mode (`development` or `production`)
- `MONGODB_URI`: MongoDB connection string
- `JWT_ACCESS_SECRET`: Secret key for short-lived access tokens (15m)
- `JWT_REFRESH_SECRET`: Secret key for long-lived refresh tokens (7d)
- `CLIENT_ORIGIN`: Allowed cross-origin domain for Express & Socket.io CORS
- `STRIPE_SECRET_KEY`: Stripe API secret key (`sk_test_...`)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret (`whsec_...`)

### Web (`apps/web/.env.local`)
- `NEXT_PUBLIC_API_URL`: Express REST API endpoint (`http://localhost:5001/api`)
- `NEXT_PUBLIC_SOCKET_URL`: Socket.io server endpoint (`http://localhost:5001`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key (`pk_test_...`)

---

## 📋 Known Limitations & Architectural Scope

To keep this portfolio project focused on high-concurrency bidding, payment security, and fulfillment lifecycle integrity:

1. **Payment & Payout Gateways**: Stripe Test Mode is integrated with signature-verified webhook handlers. Seller payout release transitions transaction status to `payoutStatus: 'initiated'` (actual bank ACH transfer routing is simulated).
2. **In-App Chat Scoping**: Messaging is transaction-scoped (`Message` model bound to `transactionId`) to facilitate vehicle handoff coordination, avoiding multi-inbox direct messaging bloat.
3. **Image Hosting**: Car listing images use curated unsplash vehicle CDN URLs.
4. **Admin Moderation**: Scoped as a lean control panel for force-closing listings, suspending users, and resolving dispute queues rather than an enterprise CRM.

---

## 📄 License & Documentation

- [API Specification Document (`API.md`)](API.md)
- [Architecture & Design Decisions (`DECISIONS.md`)](DECISIONS.md)
- [Phase Breakdown & Implementation Roadmap (`PHASES.md`)](PHASES.md)
