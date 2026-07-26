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

---

## Open / To Be Decided
*(add here as new questions come up — e.g. Cloudinary vs S3 for images, Yjs vs custom sync if collaborative features are ever added, etc.)*