# SOCKET_EVENTS.md

> Socket.io Real-Time Event Reference for RevBid Live Auction Rooms.

Server Connection: `ws://localhost:5001` (or `wss://...` in production)

---

## Authentication Handshake

Connect with token in handshake auth payload or Authorization header:
```js
const socket = io('http://localhost:5001', {
  auth: { token: '<jwt_access_token>' }
});
```
If no token is provided, the connection is accepted as an **anonymous viewer**.

---

## Client to Server Events

### `join:room`
Client joins a vehicle auction room on entering a car detail page.

**Payload**
```json
{ "carId": "60d5ec49f1b2c80015f8e4a1" }
```

---

### `leave:room`
Client leaves a vehicle auction room on component unmount or navigation.

**Payload**
```json
{ "carId": "60d5ec49f1b2c80015f8e4a1" }
```

---

## Server to Client Events

### `room:joined`
Emitted directly to the joining socket to provide initial room state and server-authoritative timestamp.

**Payload**
```json
{
  "carId": "60d5ec49f1b2c80015f8e4a1",
  "auctionEnd": "2024-01-08T00:00:00.000Z",
  "serverTime": 1700000000000,
  "watcherCount": 4
}
```

---

### `presence:update`
Broadcast to all sockets in the `carId` room when a client joins or leaves.

**Payload**
```json
{
  "carId": "60d5ec49f1b2c80015f8e4a1",
  "watcherCount": 5
}
```

---

### `bid:placed`
Broadcast to all sockets in the `carId` room immediately after a successful atomic bid placement via REST API.

**Payload**
```json
{
  "carId": "60d5ec49f1b2c80015f8e4a1",
  "currentBid": 129000,
  "bidCount": 20,
  "newBid": {
    "_id": "60d5ec49f1b2c80015f8e4a9",
    "carId": "60d5ec49f1b2c80015f8e4a1",
    "userId": "60d5ec49f1b2c80015f8e400",
    "amount": 129000,
    "status": "active",
    "maskedBidderName": "J***e",
    "createdAt": "2024-01-01T00:05:00.000Z"
  },
  "auctionEnd": "2024-01-08T00:00:00.000Z",
  "serverTime": 1700000005000
}
```

---

### `auction:extended`
Broadcast to all sockets in the `carId` room when the **anti-sniping rule** is triggered (a bid arrives within the last 60 seconds of an auction).

**Payload**
```json
{
  "carId": "60d5ec49f1b2c80015f8e4a1",
  "newAuctionEnd": "2024-01-08T00:02:00.000Z",
  "extendedBySeconds": 120,
  "serverTime": 1700000005000
}
```

---

### `auction:ended`
Broadcast to all sockets in the `carId` room when the auction timer expires and the auction closes.

**Payload**
```json
{
  "carId": "60d5ec49f1b2c80015f8e4a1",
  "winningBid": 129000,
  "winningBidderName": "J***e",
  "serverTime": 1700000120000
}
```

---

### `notification:new`
Emitted directly to a specific user's private socket room (`user:<userId>`) when a new real-time alert is triggered (`outbid`, `ending-soon`, `won`, `lost`).

**Payload**
```json
{
  "_id": "60d5ec49f1b2c80015f8e4b0",
  "userId": "60d5ec49f1b2c80015f8e400",
  "type": "outbid",
  "carId": "60d5ec49f1b2c80015f8e4a1",
  "message": "You were outbid on 2022 Porsche 911 Carrera S! Current highest bid is now $129,000.",
  "read": false,
  "createdAt": "2024-01-01T00:05:00.000Z"
}
```

