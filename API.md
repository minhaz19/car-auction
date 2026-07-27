# API.md

> REST API endpoint reference — documents all available routes, request/response shapes, and authentication requirements.

Base URL (dev): `http://localhost:5001`

---

## Health

### `GET /api/health`
No auth required.

**Response `200`**
```json
{ "status": "ok", "timestamp": "2024-01-01T00:00:00.000Z", "uptime": 12.3 }
```

---

## Auth — `/api/auth`

All cookie operations use `refreshToken` as the httpOnly cookie name, scoped to `/api/auth`.

### `POST /api/auth/register`
**Auth:** None

### `POST /api/auth/login`
**Auth:** None

### `POST /api/auth/refresh`
**Auth:** `refreshToken` httpOnly cookie (automatic)

### `POST /api/auth/logout`
**Auth:** `Authorization: Bearer <accessToken>` + `refreshToken` cookie

### `POST /api/auth/logout-all`
**Auth:** `Authorization: Bearer <accessToken>`

---

## Metadata — `/api/meta`

### `GET /api/meta/brands`
Returns an array of available vehicle manufacturers/brands.

### `GET /api/meta/models?brand={brandName}`
Returns an array of models for the specified brand.

---

## Car Listings — `/api/cars`

### `GET /api/cars`
Returns paginated, filtered, and sorted vehicle auction listings.

### `GET /api/cars/featured`
Returns top 6 live auctions closing soonest.

### `GET /api/cars/:id`
Returns single vehicle details by ID.

### `POST /api/cars`
Create a new car listing (seller/admin only).

### `PATCH /api/cars/:id`
Edit listing (seller/admin only, before first bid).

### `DELETE /api/cars/:id`
Cancel listing (seller/admin only, before first bid).

---

## Bidding — `/api/cars/:id/bid` & `/api/bids`

### `POST /api/cars/:id/bid`
Places a new bid on a live car auction. Guarantees concurrency safety via atomic conditional `findOneAndUpdate` on MongoDB.

**Auth:** `Authorization: Bearer <accessToken>`

**Body**
```json
{ "amount": 129000 }
```

- `amount`: Must exceed `currentBid` by at least the minimum increment ($100 or 1% of current bid).

**Response `201`**
```json
{
  "message": "Bid placed successfully!",
  "bid": {
    "_id": "60d5ec49f1b2c80015f8e4a9",
    "carId": "60d5ec49f1b2c80015f8e4a1",
    "amount": 129000,
    "status": "active",
    "maskedBidderName": "J***e",
    "createdAt": "2024-01-01T00:05:00.000Z"
  },
  "car": { ... }
}
```

**Errors**
| Status | Reason |
|---|---|
| 400 | Invalid amount, below minimum increment, or auction ended |
| 401 | Unauthenticated |
| 409 | Outbid! Race condition lost (another bid landed first) |

---

### `GET /api/cars/:id/bids`
Paginated bid history for a car, newest first. Masked bidder names returned for public privacy.

**Auth:** None

**Query Parameters**
| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

**Response `200`**
```json
{
  "bids": [
    {
      "_id": "60d5ec49f1b2c80015f8e4a9",
      "carId": "60d5ec49f1b2c80015f8e4a1",
      "amount": 129000,
      "status": "active",
      "maskedBidderName": "J***e",
      "createdAt": "2024-01-01T00:05:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

### `GET /api/users/me/bids`
Returns current user's bids across all car auctions (populated with car details).

**Auth:** `Authorization: Bearer <accessToken>`

**Response `200`**
Array of `IBid` objects populated with car details.

---

## User Profile, Watchlist & Notifications — `/api/users`

### `GET /api/users/me/watchlist`
Returns user's saved watchlisted car listings.

**Auth:** `Authorization: Bearer <accessToken>`

---

### `POST /api/users/me/watchlist/:carId`
Adds vehicle to user's watchlist.

**Auth:** `Authorization: Bearer <accessToken>`

---

### `DELETE /api/users/me/watchlist/:carId`
Removes vehicle from user's watchlist.

**Auth:** `Authorization: Bearer <accessToken>`

---

### `GET /api/users/me/notifications`
Paginated user notifications (outbid, ending-soon, won, lost).

**Auth:** `Authorization: Bearer <accessToken>`

---

### `PATCH /api/users/me/notifications/:id/read`
Marks single notification as read.

**Auth:** `Authorization: Bearer <accessToken>`

---

### `PATCH /api/users/me/notifications/read-all`
Marks all user notifications as read.

**Auth:** `Authorization: Bearer <accessToken>`

---

### `PATCH /api/users/me/role`
Self-serve account role upgrade (`buyer` -> `seller`).

**Auth:** `Authorization: Bearer <accessToken>`

**Body**
```json
{ "role": "seller" }
```

---

## Payments & Transactions — `/api/transactions`

### `GET /api/transactions/me`
Returns all transaction records where current user is buyer or seller.

**Auth:** `Authorization: Bearer <accessToken>`

---

### `GET /api/transactions/:id`
Returns single transaction details populated with car, buyer, and seller data.

**Auth:** `Authorization: Bearer <accessToken>` (buyer, seller, or admin)

---

### `POST /api/transactions/:id/create-payment-intent`
Generates or retrieves Stripe `PaymentIntent` client secret for Stripe Elements.

**Auth:** `Authorization: Bearer <accessToken>` (buyer only)

**Response `200`**
```json
{
  "clientSecret": "pi_3M..._secret_...",
  "stripePublishableKey": "pk_test_...",
  "amount": 129000,
  "status": "pending"
}
```

---

### `POST /api/transactions/:id/confirm`
Client-side payment confirmation trigger. Transitions transaction status to `awaiting_handoff` and reveals contact details.

**Auth:** `Authorization: Bearer <accessToken>` (buyer only)

---

### `PATCH /api/transactions/:id/confirm-handoff`
Mutual confirmation endpoint. Sets `handoffConfirmedByBuyer` or `handoffConfirmedBySeller` depending on caller identity. When both are `true`, status becomes `completed` and seller `payoutStatus` becomes `initiated`.

**Auth:** `Authorization: Bearer <accessToken>` (buyer or seller)

---

### `PATCH /api/transactions/:id/dispute`
Flags a transaction dispute, setting status to `disputed`.

**Auth:** `Authorization: Bearer <accessToken>` (buyer or seller)

**Body:**
```json
{
  "reason": "Vehicle description mismatch or pickup delay"
}
```

---

### `GET /api/transactions/:id/messages`
Returns in-app chat thread messages for a specific transaction.

**Auth:** `Authorization: Bearer <accessToken>` (buyer or seller only)

---

### `POST /api/transactions/:id/messages`
Sends a new message in the transaction chat thread and emits `message:new` to `transaction:<id>` socket room.

**Auth:** `Authorization: Bearer <accessToken>` (buyer or seller only)

**Body:**
```json
{
  "text": "Hello! I can pick up the vehicle this Saturday at 10 AM."
}
```

---

### `POST /api/transactions/:id/review`
Submits a verified 5-star rating and review for a completed transaction.

**Auth:** `Authorization: Bearer <accessToken>` (buyer or seller, once per transaction)

**Body:**
```json
{
  "rating": 5,
  "comment": "Smooth handoff coordination and immaculate car condition!"
}
```

---

## User Reviews & Public Seller Rating Badges — `/api/users`

### `GET /api/users/:id/reviews`
Returns public verified reviews, total review count, and average rating score for a user.

**Response `200`**
```json
{
  "reviews": [],
  "averageRating": 4.8,
  "totalReviews": 12
}
```

---

## Admin Panel & Moderation — `/api/admin`

All `/api/admin` endpoints require `Authorization: Bearer <accessToken>` with `role: 'admin'`.

### `GET /api/admin/analytics`
Returns platform aggregate metrics powered by MongoDB aggregation pipelines.

**Response `200`**
```json
{
  "totalActiveAuctions": 14,
  "totalBidVolume": 1450000,
  "totalUsers": 28,
  "listingsByStatus": { "live": 14, "ended": 10, "upcoming": 4 },
  "topBrands": [{ "brand": "Porsche", "count": 6 }]
}
```

---

### `GET /api/admin/cars`
Returns all vehicle listings with seller details, accepting `status` and `search` filters.

---

### `PATCH /api/admin/cars/:id/status`
Force-closes, suspends, or reactivates a car listing with a mandatory moderation reason log.

**Body:**
```json
{
  "status": "ended",
  "reason": "Seller requested early closure due to local private sale."
}
```

---

### `GET /api/admin/users`
Returns all user accounts with roles, account statuses (`active` | `suspended`), and join dates.

---

### `PATCH /api/admin/users/:id/suspend`
Toggles user account suspension status. Suspended users are barred from bidding and listing cars.

**Body:**
```json
{
  "status": "suspended"
}
```

---

### `GET /api/admin/disputes`
Lists all transactions flagged for support dispute.

---

### `PATCH /api/admin/disputes/:id/resolve`
Adjudicates and resolves a transaction dispute.

**Body:**
```json
{
  "resolutionNotes": "Verified inspection documents; initiated seller payout release."
}
```

---

### `GET /api/reviews/seller/:sellerId`
Returns all verified post-transaction reviews and average rating score for a seller.

**Response `200`**
```json
{
  "reviews": [],
  "averageRating": 5.0,
  "totalReviews": 1
}
```

---

## Webhooks — `/api/webhooks`

### `POST /api/webhooks/stripe`
Stripe signature-verified webhook endpoint for payment event processing.

**Auth:** Signature header (`stripe-signature`)

**Handled Events:** `payment_intent.succeeded` -> updates Transaction to `paid`, Car status to `sold`, and notifies seller.


