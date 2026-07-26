# Car Auction Platform — Project Requirements

**Stack:** Next.js (App Router) · React · Express.js · MongoDB · Socket.io · JWT (access + refresh)

---

## 1. Site Map

```
/                          → Home
/search                    → Search results (filtered car listings)
/car/[id]                  → Car detail + live auction room
/auth/login
/auth/register
/dashboard                 → User dashboard (bids, watchlist, listings)
/dashboard/sell             → Create/manage a listing (seller flow)
/admin                     → Admin panel (moderation, disputes)
```

---

## 2. Home Page

### 2.1 Navbar
- Logo, primary nav (Buy / Sell / How it Works / Support)
- Auth state aware: Login/Register buttons OR user avatar dropdown (Dashboard, My Bids, Logout)
- Mobile: hamburger → slide-in drawer menu
- Sticky on scroll

### 2.2 Hero / Carousel Banner
- Auto-rotating carousel, 3–5 slides (featured/ending-soon auctions, brand banners)
- Pause-on-hover, swipeable on mobile, dot indicators
- Sponsorship/collaboration slot: a distinct banner slide or side panel reserved for a "Sponsored" partner (visually separated so it reads as a real ad placement — good resume talking point: "supports a sponsored-content slot in the carousel schema")

### 2.3 Quick Search Panel
- Initial filters visible directly on home page:
  1. **Car Condition** (New / Used / Certified Pre-Owned)
  2. **Brand Name** (dropdown, e.g. BMW, Toyota, Tesla)
  3. **Model** (dependent dropdown — populates based on selected brand)
  4. **Year Range** (from–to)
- "Search" button → navigates to `/search` with query params (e.g. `/search?condition=used&brand=bmw&model=x5&yearMin=2018&yearMax=2023`)

### 2.4 Featured Listings Grid
- 6 cars shown by default (before any search) — e.g. "Ending Soon" or "Featured" auctions
- Each card: photo, make/model/year, current bid, time remaining (live countdown), bid count
- Click → `/car/[id]`

### 2.5 Footer
- Site links, socials, "How auctions work," legal/terms, newsletter signup

---

## 3. Search Results Page (`/search`)

- **Left sidebar (desktop) / collapsible drawer (mobile):** full filter panel
  - **Carried over from home page:** Car condition (New/Used/CPO), Brand, Model (dependent on brand), Year range
  - **Additional filters:**
    - Price range (min–max slider)
    - Body type (Sedan, SUV, Truck, Coupe, Hatchback...)
    - Mileage range
    - Transmission (Automatic/Manual)
    - Fuel type (Petrol, Diesel, Electric, Hybrid)
    - Auction status (Live / Ending Soon / Upcoming / Ended)
    - Color
    - Location/region (if you want a geo angle — ties into your GIS background, optional)
  - Each active filter shown as a removable "chip" above results (good UX detail, cheap to build, looks polished)
  - "Clear all filters" option
- **Sort options:** ending soonest, price low–high, most bids, newest listed
- **Results grid:** paginated or infinite-scroll car cards, each showing live current bid + countdown (via WebSocket, no manual refresh)
- Filters update the URL query params (shareable/bookmarkable search) and refetch server-side (good SSR talking point)

---

## 4. Car Detail / Live Auction Room (`/car/[id]`)

This is the centerpiece — where real-time + concurrency work lives.

### 4.1 Layout
- Image gallery (carousel, thumbnails)
- Spec sheet (year, make, model, mileage, condition, VIN, seller notes)
- **Live auction panel:**
  - Current highest bid (large, prominent)
  - Countdown timer (server-authoritative, not client-only — prevents timer manipulation)
  - Bid input + "Place Bid" button (validates against minimum increment)
  - Live bid history feed (streams in via Socket.io, newest on top)
  - Bidder count / "N people watching" presence indicator
  - **Anti-sniping rule:** if a bid lands in the last 60 seconds, auto-extend the auction by 2 minutes — a genuinely interesting rule to implement and explain in interviews
- Watchlist/heart icon (save auction to dashboard)
- Seller info (verified badge if applicable)

### 4.2 Real-Time Behavior (Socket.io)
- Client joins a room per `carId` on page load
- Server broadcasts: new bid placed, time extended, auction ended, someone joined/left (presence count)
- Optimistic UI update on the bidder's own action, reconciled with server broadcast

### 4.3 Concurrency Handling (the standout technical piece)
- Two bids arriving near-simultaneously must never both "win"
- Use MongoDB **transactions** or **optimistic locking** (version field / `findOneAndUpdate` with a condition on current highest bid) so only one bid can atomically become the new highest
- Rejected bidder gets an immediate "someone outbid you first" response, not a silent failure

---

## 5. Auth (Access + Refresh Token Flow)

- **Register/Login:** email + password (bcrypt hashed), optional email verification
- **Access token:** short-lived JWT (~15 min), sent in Authorization header, used for API calls
- **Refresh token:** long-lived, stored as httpOnly secure cookie, rotated on each use, stored/tracked in MongoDB (so you can revoke sessions — "logout everywhere" feature)
- **Middleware:** Express middleware validates access token; Next.js middleware protects dashboard/admin routes at the edge
- **Roles:** `buyer`, `seller`, `admin` — role-based access control on both API and UI (e.g. only sellers see "Create Listing")

---

## 6. Seller Flow (`/dashboard/sell`)

- Create listing: car details form, multi-image upload, starting bid, reserve price (optional), auction duration
- Edit/cancel listing (only before first bid is placed — standard auction-integrity rule)
- View bid history and current status on own listings

---

## 7. User Dashboard (`/dashboard`)

- **My Bids:** active bids, won auctions, lost auctions
- **Watchlist:** saved cars with live status
- **Notifications:** outbid alerts, auction ending soon, auction won (in-app + optionally email)
- **Won auction → Payment flow** (see below)

---

## 8. Payment (Stretch Goal, High Resume Value)

- Stripe **test mode** checkout for the winning bidder after auction close
- Escrow-style messaging even if not literally implemented ("payment held until pickup confirmed") — shows product thinking
- Seller payout status (mock/manual for MVP, real Stripe Connect if you have time — this is genuinely advanced and worth mentioning even if only partially implemented)

---

## 9. Admin Panel (Stretch Goal)

- View/moderate listings, resolve disputes, suspend users
- Basic analytics: active auctions, total bid volume, top categories

---

## 10. Tech Stack Summary

| Layer | Choice |
|---|---|
| Frontend framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Express.js (REST API) |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.io |
| Auth | JWT access + refresh, httpOnly cookies |
| File storage | Cloudinary or S3 (for car images) |
| Payments | Stripe (test mode) |
| Deployment | Vercel (frontend) + Render/Railway (Express + Socket.io backend, since Vercel doesn't run persistent WebSocket servers well) |
| Testing | Vitest/RTL (unit), Playwright (e2e — cover the bidding race-condition flow specifically) |

---

## 11. Core MongoDB Collections (rough schema)

```
users        { name, email, passwordHash, role, refreshTokens[], watchlist[] }
cars         { sellerId, make, model, year, mileage, bodyType, images[], description,
               startingBid, reservePrice, currentBid, currentBidderId,
               auctionStart, auctionEnd, status, bidHistory[] }
bids         { carId, userId, amount, timestamp }
transactions { carId, buyerId, sellerId, amount, status, stripePaymentId }
```

---

## 12. What Makes This Resume-Worthy (keep this front of mind while building)

- **Concurrency-safe bidding** is your #1 talking point — most portfolio projects don't have a real race condition to solve
- **Anti-sniping auto-extend logic** shows product thinking, not just CRUD
- **Access/refresh token rotation with revocation** shows you understand auth beyond "store JWT in localStorage" (which is actually a common anti-pattern to avoid — use httpOnly cookies)
- **Server-authoritative countdown timer** (not client `setInterval` alone) prevents an obvious exploit and is a good "what could go wrong" interview answer
- Keep a **DECISIONS.md** explaining the transaction/locking choice, the WebSocket architecture, and the SSR/SSG split — this is what turns the project from "looks nice" into "defensible engineering"