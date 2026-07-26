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

**Auth:** None

**Response `200`**
```json
["BMW", "Chevrolet", "Ford", "Mercedes-Benz", "Porsche", "Tesla", "Toyota"]
```

---

### `GET /api/meta/models?brand={brandName}`
Returns an array of models for the specified brand.

**Auth:** None

**Response `200`**
```json
["3 Series", "5 Series", "M3", "M4", "X5"]
```

---

## Car Listings — `/api/cars`

### `GET /api/cars`
Returns paginated, filtered, and sorted vehicle auction listings.

**Auth:** None

**Query Parameters**
| Parameter | Type | Description |
|---|---|---|
| `condition` | string | `New`, `Used`, `Certified Pre-Owned` |
| `make` | string | Vehicle brand name |
| `model` | string | Vehicle model name |
| `yearMin` | number | Minimum model year |
| `yearMax` | number | Maximum model year |
| `priceMin` | number | Minimum current bid price |
| `priceMax` | number | Maximum current bid price |
| `bodyType` | string | `Sedan`, `SUV`, `Truck`, `Coupe`, `Hatchback`, etc. |
| `mileageMax` | number | Maximum odometer mileage |
| `transmission` | string | `Automatic` or `Manual` |
| `fuelType` | string | `Petrol`, `Diesel`, `Electric`, `Hybrid` |
| `status` | string | `live`, `upcoming`, `ended` |
| `sort` | string | `endingSoonest`, `priceAsc`, `priceDesc`, `mostBids`, `newest` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 9) |

**Response `200`**
```json
{
  "cars": [
    {
      "_id": "60d5ec49f1b2c80015f8e4a1",
      "sellerId": { "_id": "...", "name": "RevBid Official Seller", "email": "seller@revbid.dev" },
      "make": "Porsche",
      "model": "911 Carrera S",
      "year": 2022,
      "condition": "Used",
      "bodyType": "Coupe",
      "mileage": 6200,
      "transmission": "Automatic",
      "fuelType": "Petrol",
      "color": "Guards Red",
      "images": ["https://..."],
      "description": "...",
      "startingBid": 115000,
      "currentBid": 128000,
      "reservePrice": 126500,
      "auctionStart": "2024-01-01T00:00:00.000Z",
      "auctionEnd": "2024-01-08T00:00:00.000Z",
      "status": "live",
      "bidCount": 19,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 35,
  "page": 1,
  "totalPages": 4
}
```

---

### `GET /api/cars/featured`
Returns top 6 live auctions closing soonest.

**Auth:** None

**Response `200`**
Array of 6 `ICar` objects.

---

### `GET /api/cars/:id`
Returns single vehicle details by ID.

**Auth:** None

**Response `200`**
Single `ICar` object populated with seller details.

---

### `POST /api/cars`
Create a new car listing.

**Auth:** `Authorization: Bearer <accessToken>` (Role: `seller` or `admin`)

**Body**
```json
{
  "make": "BMW",
  "model": "M4 Competition",
  "year": 2023,
  "condition": "Certified Pre-Owned",
  "bodyType": "Coupe",
  "mileage": 8500,
  "transmission": "Automatic",
  "fuelType": "Petrol",
  "color": "Isle of Man Green",
  "images": ["https://..."],
  "description": "Mint condition M4 Competition with carbon package.",
  "startingBid": 68000,
  "reservePrice": 75000,
  "auctionDurationDays": 7
}
```

**Response `201`**
Created `ICar` object.

---

### `PATCH /api/cars/:id`
Edit listing (allowed only if no bids have been placed yet and user is listing owner or admin).

**Auth:** `Authorization: Bearer <accessToken>` (Role: `seller` or `admin`)

**Response `200`**
Updated `ICar` object.

---

### `DELETE /api/cars/:id`
Cancel/delete listing (allowed only if no bids have been placed yet and user is listing owner or admin).

**Auth:** `Authorization: Bearer <accessToken>` (Role: `seller` or `admin`)

**Response `200`**
```json
{ "message": "Listing cancelled successfully" }
```
