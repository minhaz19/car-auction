# Architecture Decisions — RevBid (Car Auction Platform)

Records *why* a choice was made, not just what was built. This is the file to reference in interviews when asked "why did you do X instead of Y."

---

## Monorepo (Bun workspaces) over separate repos
**Decision:** Single repo (`apps/web`, `apps/server`, `packages/shared`) using Bun workspaces.
**Why:** Frontend and backend evolve together and share types (Car, Bid, User, Socket event payloads). One repo means one source of truth for those types instead of copy-pasting or publishing an internal npm package. Also simpler for a solo project — one CI pipeline, one README, one link on a resume.
**Alternative considered:** Turborepo/Nx — rejected as unnecessary overhead at this scale. Workspaces alone are sufficient for a two-app solo project; would reconsider at team scale or if build times became a real problem.

## Bun over npm/pnpm
**Decision:** Bun for package management and local dev runtime.
**Why:** Faster installs and dev server startup. Node-compatible enough that Express and Next.js both run fine on it locally.
**Caveat:** Deployment targets (Vercel, Render/Railway) may still run the actual production build/runtime on Node — verify Bun runtime support per platform at deploy time; not a blocker, since Bun's output is Node-compatible.

## httpOnly cookies for refresh token, not localStorage
**Decision:** Refresh token stored as an httpOnly, secure, sameSite cookie. Access token sent in memory/Authorization header, never persisted to localStorage.
**Why:** localStorage is readable by any JS on the page, making it vulnerable to XSS-based token theft. httpOnly cookies aren't accessible to JavaScript at all, which removes that entire attack surface for the longer-lived refresh token.
**Trade-off:** Requires CORS + cookie configuration to be handled carefully between the Next.js app and Express API (credentials: true, proper sameSite settings), which is more setup than just reading a token from localStorage — accepted as worth the security trade-off.

## Refresh token rotation, not just reissue
**Decision:** Every time `/api/auth/refresh` is called, the old refresh token is invalidated and a new one is issued and stored.
**Why:** If a refresh token is ever stolen, rotation limits the window of misuse — a stolen token becomes invalid the next time the legitimate user refreshes, and reuse of an already-rotated token can be treated as a signal of compromise (worth adding detection for later: if an old/rotated token is presented again, revoke all sessions for that user).
**Alternative considered:** Simple reissue without rotation — rejected as weaker; a leaked long-lived token would stay valid for its full 7-day life with no way to detect misuse.

## Redux Toolkit + RTK Query for state management
**Decision:** Redux Toolkit (`createSlice`) for client/UI state (auth user, filter drawer, active auction room UI state) and RTK Query for all server-derived state (car listings, filters, bid history, dashboard data, mutations).
**Why:** One consistent library handles both client and server state rather than combining two separate tools — simpler mental model, one set of devtools, one data-fetching/caching pattern to maintain. RTK Query provides caching, background refetching, and loading/error states out of the box, same as it would with a separate query library, but stays within the Redux ecosystem.
**Real-time integration:** On a Socket.io bid event, dispatch an action that updates the RTK Query cache directly (`api.util.updateQueryData`) or invalidates the relevant tag to trigger a refetch — keeps live updates and fetched data in the same cache rather than running two separate state systems.
**Alternative considered:** Zustand + TanStack Query — a lighter-weight split that would also work well here. Redux Toolkit + RTK Query was chosen instead for having one unified library end-to-end, and because RTK remains the more common pattern in larger/enterprise codebases.

## Component reusability standard
**Decision:** All UI built as small, reusable components under `components/ui` (primitives: Button, Card, Badge, etc.) and `components/shared` (composed, project-specific: FilterChip, CountdownTimer, CarCard), rather than one-off inline JSX per page.
**Why:** Multiple pages (home, search, car detail, dashboard) reuse the same visual elements (car cards, filters, badges). A shared component library keeps styling consistent and makes future phases (real-time updates, design polish) faster since changes propagate from one place.

## Static Brand → Model Mapping dataset
**Decision:** Store brand-to-model relationships in a static JSON/TypeScript module (`brandModels.ts`) exposed via `/api/meta/brands` and `/api/meta/models?brand=X`, rather than querying a separate database collection or fetching an external 3rd-party API.
**Why:** Car makes and models change infrequently. A curated static dataset of 15 popular brands and 100+ models ensures instant API responses, zero database query latency, and reliable dependent dropdown behavior without API rate limits or external service dependencies during development.
**Trade-off / Future Swap:** In a full enterprise production system, this could be swapped for a dedicated Vehicle DB service (like NHTSA VPIC API or CarQuery API) or a MongoDB `makes_models` reference collection. The current frontend RTK Query interface (`getBrands`, `getModelsByBrand`) abstracts this source, allowing a seamless swap without frontend changes.

## Concurrency-Safe Bidding via Atomic Conditional `findOneAndUpdate`
**Decision:** Use a single atomic `Car.findOneAndUpdate({ _id: carId, currentBid: { $lt: newBidAmount }, status: 'live', auctionEnd: { $gt: now } }, ...)` query to execute bid placement, rather than a multi-step read-then-write or a heavy multi-document transaction.
**Why:** In high-concurrency auctions, two bids arriving near-simultaneously (e.g. 10ms apart) will experience a race condition in a standard read-then-write flow (`const car = await Car.findById(); if (newBid > car.currentBid) car.currentBid = newBid; await car.save()`). Both requests read the old bid value, both pass validation, and both write, causing a phantom overwrite where the lower/earlier bid accidentally overwrites the higher/later bid.
**How it prevents two people from winning the same bid:** MongoDB guarantees document-level lock atomicity on single-document operations. The query condition `currentBid: { $lt: newBidAmount }` acts as an optimistic lock at the database level. If Request A and Request B land concurrently with identical amounts $75,000, whichever request arrives at MongoDB first mutates `currentBid` to $75,000. When Request B's update query executes 2ms later, `currentBid: { $lt: 75000 }` evaluates to `false` because `currentBid` is now $75,000. The update matches 0 documents and returns `null`. Request B receives an immediate 409 Conflict ("Outbid! Another bidder placed $75,000 before your request arrived"), guaranteeing that exactly one bid wins cleanly.
**Alternative considered:** Multi-document MongoDB ACID Transactions (`session.startTransaction()`) — rejected as unnecessary overhead for updating a single Car document state. Single-document conditional updates provide identical race-condition protection with significantly lower latency and database overhead.

## Server-Authoritative Time Offset vs. Trusting Client Clocks
**Decision:** Calculate a single time offset (`serverTime - localReceiptTime`) when joining a Socket.io room and compute local countdown timers using `Date.now() + offset`, rather than trusting the user's system clock or broadcasting a continuous 1-second server tick to all clients.
**Why:** System clocks on client laptops/phones are notoriously inaccurate or can be intentionally manipulated by changing device date settings. Trusting client clocks would allow malicious users to spoof auction end times or place invalid late bids. Conversely, broadcasting a server timestamp interval tick every second to thousands of connected sockets creates immense CPU and network overhead on the server.
**Solution:** The server sends an authoritative `serverTime` timestamp on room join and extension events. The client measures its local receipt timestamp, calculates the offset delta once, and counts down locally using the offset-adjusted time. This guarantees 100% clock tamper protection with zero recurring server broadcast overhead.

## Separation of Write Path (REST API) vs. Broadcast Path (Socket.io)
**Decision:** Bid submission requests execute via standard HTTP REST (`POST /api/cars/:id/bid`), while live updates (presence, new bids, anti-sniping extensions) are broadcast asynchronously via Socket.io.
**Why:** REST APIs provide superior HTTP semantics for state-modifying writes: standard status codes (201 Created, 409 Conflict, 400 Bad Request), built-in middleware error handling, rate limiting, and seamless integration with HTTP-only cookies and standard browser security policies. WebSockets excel at lightweight multi-cast event distribution.
**Benefit:** Isolating writes to REST ensures database transactions and response status codes remain predictable and easy to audit, while WebSockets handle pure real-time push updates to all active room spectators without coupling the write pipeline to socket connection availability.

## Simple Interval Check vs. Heavy Job Queue (BullMQ/Redis) for Ending-Soon Alerts
**Decision:** Implement a lightweight 30-second server interval (`startNotificationCron.ts`) to query MongoDB for auctions ending in <5 minutes and auctions that recently closed, rather than introducing a Redis-backed job queue like Bull or BullMQ.
**Why:** A full job queue introduces Redis infra overhead, worker process management, and extra connection management, which is unnecessary complexity for a single-server dev architecture. A 30-second interval query indexed on `{ status: 'live', auctionEnd: 1 }` consumes under 1ms of execution time per tick and reliably catches ending-soon and newly closed auctions at this scale.
**Future Upgrade Path:** At high production volume (100,000+ simultaneous auctions), this can be refactored to BullMQ or AWS EventBridge scheduled tasks without changing the frontend or notification socket interfaces.

## Self-Serve Account Role Upgrade (`buyer` -> `seller`)
**Decision:** Allow buyers to self-serve upgrade their account role to `seller` via `PATCH /api/users/me/role` directly from the dashboard or when attempting to create a listing.
**Why:** Requiring administrative approval or separate registration flows creates friction for users wanting to list vehicles immediately. Self-serve role upgrade streamlines onboarding while maintaining strict API permission enforcement (`requireRole('seller', 'admin')`) on listing creation endpoints.

## Image Upload Stub Strategy (URL Input + Preset Picker)
**Decision:** Build a rich `<ImageUploader>` UI component supporting image URL inputs, Unsplash high-resolution preset pickers, and cover-photo ordering, while flagging the underlying storage as a stub ready for S3 / Cloudinary integration.
**Why:** Wiring a live cloud storage bucket (AWS S3 or Cloudinary API) requires external credentials, signed URL signatures, and CORS bucket policies that complicate setup without adding core application architectural value. A client-side URL & preset uploader provides 100% of the UI/UX capability and data structure (`images: string[]`) needed to build, test, and demonstrate the seller workflow cleanly.

---

## Open / To Be Decided
*(add here as new questions come up — e.g. Cloudinary vs S3 for images, Yjs vs custom sync if collaborative features are ever added, etc.)*