# PHASES.md

> Breakdown of project phases and their completion status — tracks what has been built, what is in progress, and what is upcoming.

---

## ✅ Phase 0 — Monorepo Setup (Done)

**Goal:** Scaffold the full project structure with zero business logic.

- [x] Bun workspaces configured (`apps/*`, `packages/*`)
- [x] `apps/web` — Next.js 16.2.12, React 19, TypeScript, Tailwind CSS v4, ESLint, Prettier
- [x] `apps/web` — shadcn/ui initialized (deps + `components.json` + `src/lib/utils.ts`)
- [x] `apps/server` — Express, TypeScript, Socket.io, Mongoose, dotenv, CORS
- [x] `apps/server` — Health-check route `GET /api/health`
- [x] `apps/server` — MongoDB connection file (`src/db/connection.ts`), no model schemas
- [x] `apps/server` — `.env.example` with `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`
- [x] `packages/shared` — Empty TypeScript package (`@car-auction/shared`) scaffolded
- [x] `.github/workflows/ci.yml` — lint + typecheck on both apps on push
- [x] Root docs — `README.md`, `DECISIONS.md`, `PHASES.md`, `API.md`, `REQUIREMENTS.md`
- [x] Verified: `bun install`, both dev servers start, `GET /api/health` responds `200 OK`, both apps typecheck and lint clean

---

## ✅ Phase 1 — Authentication (Done)

**Goal:** Full JWT auth stack — register, login, refresh, logout — with protected routes and session restore.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/user.ts` — `IUserPublic`, `JwtPayload`, `UserRole` shared types
- [x] `src/models/User.ts` — Mongoose User schema (`name`, `email`, `passwordHash`, `role`, `refreshTokens[]`, timestamps). `toJSON` strips sensitive fields.
- [x] `src/config/jwt.ts` — `generateAccessToken` (15 min), `generateRefreshToken` (7 days), `verifyAccessToken`, `verifyRefreshToken`
- [x] `src/middleware/auth.ts` — `requireAuth` (Bearer token → `req.user`), `requireRole(...roles)` factory
- [x] `src/routes/auth.ts` — 5 endpoints: register, login, refresh (with rotation + reuse detection), logout, logout-all
- [x] `src/index.ts` — `cookie-parser` mounted, auth router mounted at `/api/auth`
- [x] MongoDB Atlas connected via `.env`

### Frontend (`apps/web`)
- [x] `@reduxjs/toolkit`, `react-redux`, `axios`, `@car-auction/shared` installed
- [x] `src/store/slices/authSlice.ts` — Redux slice: `user`, `accessToken`, `isLoading`
- [x] `src/store/services/authApi.ts` — RTK Query: all 5 auth mutations with `credentials: 'include'`
- [x] `src/store/index.ts` — Redux store configured with auth slice + RTK Query middleware
- [x] `src/hooks/useRedux.ts` — typed `useAppDispatch` / `useAppSelector`
- [x] `src/hooks/useAuth.ts` — `useAuth()` hook: login, register, logout, logoutAll actions + state selectors
- [x] `src/providers/StoreProvider.tsx` — Redux Provider + silent session restore on mount (`/refresh` call)
- [x] `src/app/layout.tsx` — wrapped in `StoreProvider`, updated with proper site metadata
- [x] `src/app/auth/login/page.tsx` — functional login form
- [x] `src/app/auth/register/page.tsx` — functional register form with confirm-password check
- [x] `src/app/dashboard/page.tsx` — protected placeholder showing user name + role
- [x] `src/middleware.ts` — Next.js edge middleware protecting `/dashboard/*`, redirects unauthenticated to `/auth/login`
- [x] `.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:5001`

### Docs
- [x] `API.md` — all endpoints documented with request/response shapes and error tables
- [x] `DECISIONS.md` — httpOnly cookies, token rotation, Redux Toolkit + RTK Query decisions (written by you)
- [x] `PHASES.md` — this file

### Verified
- [x] `tsc --noEmit` clean on both apps
- [x] ESLint clean on both apps
- [x] Register → login → `/dashboard` redirect works
- [x] `/dashboard` without session → redirects to `/auth/login`
- [x] Silent refresh restores session on page reload

---

## ✅ Phase 2 — Car Listings & Search (Done)

**Goal:** Vehicle models, listings CRUD, brand-model metadata, seed data, Home Page, and Search Results Page.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/car.ts` — `ICar`, `CarFilterParams`, `PaginatedCarsResponse` shared interfaces
- [x] `src/models/Car.ts` — Mongoose schema for vehicle listings with indexing on make, model, year, status, currentBid, and auctionEnd
- [x] `src/data/brandModels.ts` — static brand-to-model dictionary covering 15 manufacturers
- [x] `src/routes/meta.ts` — `GET /api/meta/brands` & `GET /api/meta/models?brand=X`
- [x] `src/routes/cars.ts` — CRUD routes: `GET /api/cars` (filtered/paginated/sorted), `GET /api/cars/featured` (6 featured live cars), `GET /api/cars/:id`, `POST /api/cars` (seller/admin), `PATCH /api/cars/:id`, `DELETE /api/cars/:id`
- [x] `src/seed.ts` — database seed script creating default seller user and 35+ realistic car listings

### Frontend (`apps/web`)
- [x] `src/store/services/carsApi.ts` — RTK Query service for cars and metadata API endpoints
- [x] `src/components/shared/Navbar.tsx` — responsive sticky header with logo, navigation links, user dropdown, and mobile drawer
- [x] `src/components/shared/Footer.tsx` — site footer with quick links, support info, and newsletter form
- [x] `src/components/shared/Carousel.tsx` — auto-rotating hero banner with sponsored partner slide
- [x] `src/components/shared/QuickSearchPanel.tsx` — home page filter form with brand & dependent model dropdowns
- [x] `src/components/shared/CarCard.tsx` — vehicle card with image, condition badge, status pill, mileage, bid info, and countdown timer placeholder
- [x] `src/components/shared/FilterSidebar.tsx` — multi-filter sidebar for desktop and drawer for mobile
- [x] `src/components/shared/FilterChip.tsx` — removable active search filter tags
- [x] `src/app/page.tsx` — rich Home Page with Hero Carousel, Quick Search, Featured Cars grid, and How It Works section
- [x] `src/app/search/page.tsx` — Search Results Page with URL parameter sync, active filter chips, sort dropdown, and paginated grid
- [x] `src/app/car/[id]/page.tsx` — Vehicle Detail Page with photo gallery, seller notes, specs table, and current bid panel

### Docs
- [x] `API.md` — updated with `/api/meta` and `/api/cars` route specs
- [x] `DECISIONS.md` — added entry for Static Brand → Model Mapping dataset choice
- [x] `PHASES.md` — this file

---

## ✅ Phase 3 — Concurrency-Safe Bidding & Car Detail Auction Room (Done)

**Goal:** Bid model, atomic conditional `findOneAndUpdate` bid placement, bid history, RTK Query integration, and componentized Car Detail page.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/bid.ts` — `IBid`, `BidStatus`, `PaginatedBidsResponse` shared types & `maskName()` helper
- [x] `src/models/Bid.ts` — Mongoose schema for bids (`carId`, `userId`, `amount`, `status`) with compound index on `carId` and `createdAt`
- [x] `src/routes/bids.ts` — `POST /api/cars/:id/bid` using atomic `Car.findOneAndUpdate({ currentBid: { $lt: amount }, status: 'live' })` to prevent race condition over-writes
- [x] `src/routes/bids.ts` — Explicit error responses for 409 Outbid, 400 Below Minimum Increment, and 400 Auction Ended
- [x] `src/routes/bids.ts` — `GET /api/cars/:id/bids` (paginated bid history with bidder names masked e.g. `J***e`) and `GET /api/users/me/bids` (current user's bid history)

### Frontend (`apps/web`)
- [x] `src/store/services/carsApi.ts` — extended with `getCarBids`, `getUserBids`, and `placeBid` endpoints with automatic cache tag invalidation
- [x] `src/components/shared/ImageGallery.tsx` — main photo showcase with thumbnail selector
- [x] `src/components/shared/SpecSheet.tsx` — vehicle specification grid, seller guarantee badge, and description
- [x] `src/components/shared/AuctionPanel.tsx` — prominent current bid, minimum increment prompt, bid input, "Place Bid" button, error/outbid alert notifications, and watchlist heart toggle stub
- [x] `src/components/shared/BidHistoryList.tsx` — paginated list displaying masked bidder names (`M***z`), amounts, status badges, and relative time
- [x] `src/app/car/[id]/page.tsx` — assembled Car Detail Page layout

### Docs
- [x] `API.md` — updated with `POST /api/cars/:id/bid`, `GET /api/cars/:id/bids`, and `GET /api/users/me/bids` specs
- [x] `DECISIONS.md` — documented atomic conditional `findOneAndUpdate` concurrency control approach
- [x] `PHASES.md` — this file

---

## ✅ Phase 4 — Real-Time Auctions & WebSockets (Done)

**Goal:** Socket.io room connections, live broadcasts (`bid:placed`, `auction:extended`, `presence:update`), anti-sniping auto-extension logic (+2m in last 60s), server-authoritative time sync, and RTK Query cache reconciliation.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/socket.ts` — shared socket event and payload interfaces (`bid:placed`, `auction:extended`, `presence:update`, `room:joined`)
- [x] `src/socket.ts` — Socket.io server instance attached to Express HTTP server with JWT handshake authentication, room subscription per `carId`, and presence tracking (`watcherCount`)
- [x] `src/routes/bids.ts` — integrated anti-sniping auto-extend rule: if a bid lands in the last 60 seconds, `auctionEnd` is extended by 120 seconds (+2 minutes) and broadcast to room
- [x] `src/routes/bids.ts` — broadcast `bid:placed` and `auction:extended` events via Socket.io on successful bid placement

### Frontend (`apps/web`)
- [x] `socket.io-client` installed and singleton instance configured in `src/lib/socket.ts`
- [x] `src/hooks/useAuctionRoom.ts` — custom hook managing room subscription, presence tracking (`watcherCount`), connection status (`isReconnecting`), server-time-offset calculation, and RTK Query cache updates via `dispatch(carsApi.util.updateQueryData(...))`
- [x] `src/components/shared/CountdownTimer.tsx` — server-authoritative countdown timer with offset calculation, pulsing highlight animation on anti-sniping extension, and `aria-live="polite"` region
- [x] `src/components/shared/AuctionPanel.tsx` — updated with live presence indicator ("N people watching"), socket reconnection status banner, and live countdown timer
- [x] `src/components/shared/BidHistoryList.tsx` — animated live entrance for new incoming bids
- [x] `src/app/car/[id]/page.tsx` — wired to `useAuctionRoom` hook

### Docs
- [x] `SOCKET_EVENTS.md` — created comprehensive documentation for all WebSocket events
- [x] `DECISIONS.md` — documented Server-Authoritative Time Offset and Separation of Write Path vs. Broadcast Path decisions
- [x] `PHASES.md` — this file

---

---

## ✅ Phase 5 — Seller Flow + User Dashboard (Done)

**Goal:** Watchlist management, real-time push notifications (`outbid`, `ending-soon`, `won`, `lost`), seller listing creation/management workflow, buyer dashboard, and self-serve role upgrade.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/notification.ts` — `INotification`, `NotificationType`, `PaginatedNotificationsResponse` shared types
- [x] `src/models/User.ts` — updated with `watchlist: [{ type: Schema.Types.ObjectId, ref: 'Car' }]`
- [x] `src/models/Notification.ts` — Mongoose schema for notifications indexed on `{ userId: 1, createdAt: -1 }`
- [x] `src/routes/users.ts` — Watchlist (`GET/POST/DELETE /api/users/me/watchlist`), Notifications (`GET/PATCH /api/users/me/notifications`), and Role upgrade (`PATCH /api/users/me/role`)
- [x] `src/services/notificationCron.ts` — background interval service checking auctions ending in <5 mins (`ending-soon`) and newly closed auctions (`won`/`lost`)
- [x] `src/routes/bids.ts` — creates `outbid` notification and emits `notification:new` to `user:<userId>` room when top bidder is dethroned

### Frontend (`apps/web`)
- [x] `src/store/services/usersApi.ts` — RTK Query service for watchlist, notifications, and role upgrade
- [x] `src/components/ui/FormField.tsx`, `Select.tsx`, `ImageUploader.tsx` — reusable primitives for forms and image selection
- [x] `src/components/shared/Navbar.tsx` — notification bell icon with unread badge, popover dropdown list, and real-time `notification:new` socket subscription
- [x] `src/components/shared/AuctionPanel.tsx` — heart toggle button wired to `useAddToWatchlistMutation` / `useRemoveFromWatchlistMutation` with optimistic update
- [x] `src/app/dashboard/page.tsx` — rebuilt Dashboard with tabs for **My Bids** (live, won, lost), **Watchlist**, **Notifications**, and **My Listings** (seller view)
- [x] `src/app/dashboard/sell/page.tsx` — vehicle listing creation form with role check and self-serve upgrade prompt
- [x] `src/app/dashboard/sell/[id]/page.tsx` — seller listing management detail view

### Docs
- [x] `API.md` — updated with user profile, watchlist, notification, and role endpoints
- [x] `SOCKET_EVENTS.md` — updated with `notification:new` payload spec
- [x] `DECISIONS.md` — documented Ending-Soon Interval vs Queue choice, Self-Serve Role Upgrade, and Image Upload Stub strategy
- [x] `PHASES.md` — this file

---

## ✅ Phase 6 — Stripe Payments & Winner Checkout (Done)

**Goal:** Post-auction winner checkout flow using Stripe test mode, Stripe Elements, PaymentIntent creation, signature-verified Stripe webhooks, and seller payout status tracking.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/transaction.ts` — `ITransaction`, `TransactionStatus`, `PayoutStatus` shared types
- [x] `src/models/Transaction.ts` — Mongoose Transaction schema indexed on `carId`, `buyerId`, `sellerId`, and `stripePaymentIntentId`
- [x] `src/config/stripe.ts` — Stripe SDK initialization and configuration helper module
- [x] `src/routes/transactions.ts` — `GET /api/transactions/:id`, `GET /api/transactions/me`, `POST /api/transactions/:id/create-payment-intent`, `POST /api/transactions/:id/confirm`
- [x] `src/routes/webhooks.ts` — `POST /api/webhooks/stripe` signature-verified raw body handler processing `payment_intent.succeeded` events
- [x] `src/services/notificationCron.ts` — creates `Transaction` and Stripe `PaymentIntent` when auction ends with winning bid

### Frontend (`apps/web`)
- [x] `@stripe/stripe-js` and `@stripe/react-stripe-js` installed
- [x] `src/store/services/transactionsApi.ts` — RTK Query service for transactions and payment intents
- [x] `src/components/shared/CheckoutForm.tsx` — reusable `<CheckoutForm>` component wrapping Stripe Elements `<PaymentElement>` with test card hint (`4242 4242 4242 4242`)
- [x] `src/app/dashboard/checkout/[transactionId]/page.tsx` — Winner Checkout Page with vehicle order summary and Stripe Elements form
- [x] `src/app/dashboard/page.tsx` — added "Payment Due — Complete Checkout" button/badge on won auctions
- [x] `src/app/dashboard/sell/[id]/page.tsx` — added transaction payment status badge and payout processing status indicator

### Docs
- [x] `API.md` — updated with transactions and webhook endpoints
- [x] `DECISIONS.md` — documented Stripe Webhook Source of Truth and Seller Payout Stub decisions
- [x] `PHASES.md` — this file

---

## ✅ Phase 7 — Design Polish & Performance Pass (Done)

**Goal:** Visual overhaul, design system token unification (`#121212` background, `#10B981` Emerald accent), Google Fonts (`Inter` + `JetBrains_Mono`), centerpiece Car Detail page (64px+ bid ticker, pulsing LIVE badge, team crest vehicle badge), restrained Framer Motion animations, mobile touch target audit (>=44px), and Next.js performance optimizations.

### Design & Visual System (`apps/web`)
- [x] `src/app/layout.tsx` — Google Fonts integration (`Inter` for UI sans-serif, `JetBrains_Mono` for display numeric bid tickers & countdowns) with zero FOUT
- [x] `src/app/globals.css` — CSS design tokens defined (`#121212` near-black background, `#10B981` Emerald accent, glassmorphism utilities)
- [x] `src/components/shared/AuctionPanel.tsx` — centerpiece overhaul: 64px+ JetBrains Mono current bid display (`text-5xl sm:text-6xl`), pulsing Emerald LIVE badge, `aria-live="polite"` region, 44px+ touch targets
- [x] `src/components/shared/ImageGallery.tsx` — team-crest style RevBid Verified badge overlaid on main vehicle banner
- [x] `src/components/shared/BidHistoryList.tsx` — Framer Motion (`motion.div`) restrained slide-and-fade entrance (~200ms) on live bid updates
- [x] `src/components/shared/CarCard.tsx` — standardized card tokens, hover lift transition (`hover:-translate-y-1.5`), JetBrains Mono price formatting
- [x] `src/app/dashboard/checkout/[transactionId]/page.tsx` — dynamic code-splitting for heavy Stripe Elements component using `next/dynamic`

### Docs
- [x] `DECISIONS.md` — documented Design System Architecture (Sofascore live ticker inspiration) and Performance & Zero-FOUT Optimization strategy
- [x] `PHASES.md` — this file

## ✅ Phase 6.5 — Transaction Lifecycle, Handoff Loop & Reviews (Done)

**Goal:** Complete post-auction vehicle handoff lifecycle including contact information reveal (buyer <-> seller), transaction-scoped real-time in-app chat thread, dual-party mutual handoff completion confirmation (`handoffConfirmedByBuyer` & `handoffConfirmedBySeller`), verified seller rating badges (`★ 4.8 (12 reviews)`), and customer support dispute path stub.

### Backend (`apps/server`)
- [x] `packages/shared/src/types/transaction.ts`, `message.ts`, `review.ts` — shared interfaces for handoff booleans, `IMessage`, and `IReview`
- [x] `src/models/Transaction.ts` — updated Mongoose schema with `status` enum (`awaiting_handoff`), `handoffConfirmedByBuyer`, `handoffConfirmedBySeller`, `completedAt`, `disputed`
- [x] `src/models/Message.ts` — Mongoose schema for transaction-scoped in-app chat messages
- [x] `src/models/Review.ts` — Mongoose schema for verified seller reviews with compound index `{ transactionId: 1, reviewerId: 1 }`
- [x] `src/socket.ts` — added `transaction:join` and `transaction:leave` socket room subscription handlers
- [x] `src/routes/transactions.ts` — added `GET/POST /api/transactions/:id/messages` (emits `message:new`), `PATCH /api/transactions/:id/confirm-handoff` (mutual confirmation), `PATCH /api/transactions/:id/dispute`, `POST /api/transactions/:id/review`
- [x] `src/routes/users.ts` — added `GET /api/users/:id/reviews` returning user reviews and average score

### Frontend (`apps/web`)
- [x] `src/store/services/transactionsApi.ts` & `usersApi.ts` — added `confirmHandoff`, `disputeTransaction`, `getMessages`, `sendMessage`, `submitTransactionReview`, and `getUserReviews`
- [x] `src/components/shared/MessageThread.tsx` — real-time transaction chat component with Socket.io auto-scroll and instant message dispatch
- [x] `src/components/shared/HandoffTracker.tsx` — visual status progress bar with buyer & seller confirmation badges
- [x] `src/components/shared/SellerRatingBadge.tsx` — reusable star rating badge (`★ 4.8 (12 reviews)`) rendered on Car Cards, Car Details, and Dashboard
- [x] `src/app/dashboard/transaction/[id]/page.tsx` — dedicated Transaction Handoff Portal page combining order summary, contact reveal, `<MessageThread>`, `<HandoffTracker>`, Review Modal, and Dispute button

### Docs
- [x] `API.md` — updated with all Phase 6.5 endpoints
- [x] `DECISIONS.md` — documented Transaction-Scoped In-App Threading and Mutual Confirmation Model decisions
- [x] `PHASES.md` — this file

## ✅ Phase 8 — Admin Panel, Moderation & Analytics (Done)

**Goal:** Build a lean, functional Admin Control Panel with role enforcement (`requireRole('admin')`), listing moderation (force-close, suspend with logged reasons), user account suspension management, dispute queue adjudication, and MongoDB aggregation analytics visualized via code-split Recharts.

### Shared & Backend (`packages/shared` & `apps/server`)
- [x] `packages/shared/src/types/admin.ts` — shared interfaces for `AdminAnalyticsResponse`, `IAdminUser`, payload contracts
- [x] `src/models/User.ts` — updated Mongoose schema with `status: 'active' | 'suspended'`
- [x] `src/middleware/auth.ts` — updated `requireAuth` to verify account suspension status (`403 Forbidden`)
- [x] `src/routes/admin.ts` — added `/api/admin/analytics` (MongoDB pipeline), `/api/admin/cars`, `/api/admin/users`, `/api/admin/disputes`
- [x] `src/seed.ts` — seeded default admin user (`admin@revbid.com` / `AdminPass123!`)

### Frontend (`apps/web`)
- [x] `src/store/services/adminApi.ts` — RTK Query service for all `/api/admin/*` endpoints
- [x] `src/components/admin/AdminNavbar.tsx` — navigation bar for admin views
- [x] `src/components/admin/AdminTableRow.tsx` — dense reusable table row primitive
- [x] `src/components/admin/AdminAnalyticsCharts.tsx` — code-split Recharts visualization (BarChart & PieChart)
- [x] `src/app/admin/page.tsx` — Analytics Dashboard with stat cards + dynamic Recharts
- [x] `src/app/admin/listings/page.tsx` — Listing Moderation view with filter controls & action modal
- [x] `src/app/admin/users/page.tsx` — User Management view with Suspend/Reinstate toggle buttons
- [x] `src/app/admin/disputes/page.tsx` — Dispute Queue Resolution view with adjudication modal

### Docs
- [x] `API.md` — updated with all `/api/admin/*` endpoints
- [x] `DECISIONS.md` — documented Admin Moderation Panel Scoping Strategy and Dynamic Code-Splitting of Recharts
- [x] `PHASES.md` — this file

---

## 🎉 Project Complete — Phases 0-8 Fully Implemented!
All core features, real-time Socket.io bidding engine, Mongoose models, Express REST APIs, RTK Query state management, Stripe test checkout flow, post-win fulfillment coordination, mutual handoff confirmation, in-app real-time chat, seller rating badges, admin moderation panel, MongoDB aggregation analytics, responsive UI, and performance optimizations are complete and verified.
