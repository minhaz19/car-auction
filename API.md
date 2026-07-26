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
