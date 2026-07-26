import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './config/jwt';
import { Car } from './models/Car';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  JwtPayload,
} from '@car-auction/shared';

interface SocketData {
  user?: JwtPayload;
  currentRoom?: string;
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> | null = null;

// Track presence: carId -> Set of socket IDs
const roomPresenceMap = new Map<string, Set<string>>();

function getWatcherCount(carId: string): number {
  return roomPresenceMap.get(carId)?.size || 0;
}

export function initSocketServer(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        process.env.CLIENT_ORIGIN || 'http://localhost:3000',
      ],
      credentials: true,
    },
  });

  // Auth Middleware
  io.use((socket: TypedSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : null);

    if (token) {
      try {
        socket.data.user = verifyAccessToken(token);
      } catch {
        // Token invalid, allow connection as anonymous viewer
      }
    }
    next();
  });

  io.on('connection', (socket: TypedSocket) => {
    // Join user private room for direct notifications if authenticated
    if (socket.data.user?.sub) {
      socket.join(`user:${socket.data.user.sub}`);
    }

    // 1. Client joins a vehicle auction room
    socket.on('join:room', async ({ carId }) => {
      if (!carId) return;

      // Leave previous room if any
      if (socket.data.currentRoom && socket.data.currentRoom !== carId) {
        leaveRoom(socket, socket.data.currentRoom);
      }

      socket.join(carId);
      socket.data.currentRoom = carId;

      // Update presence
      if (!roomPresenceMap.has(carId)) {
        roomPresenceMap.set(carId, new Set());
      }
      roomPresenceMap.get(carId)!.add(socket.id);

      const watcherCount = getWatcherCount(carId);

      // Fetch latest car data to send server-authoritative auctionEnd and serverTime
      let auctionEndStr = new Date().toISOString();
      try {
        const car = await Car.findById(carId).select('auctionEnd');
        if (car) auctionEndStr = car.auctionEnd.toISOString();
      } catch {
        // Fallback
      }

      // Send room:joined event to requesting client
      socket.emit('room:joined', {
        carId,
        auctionEnd: auctionEndStr,
        serverTime: Date.now(),
        watcherCount,
      });

      // Broadcast presence update to the room
      io?.to(carId).emit('presence:update', { carId, watcherCount });
    });

    // 2. Client leaves room explicitly
    socket.on('leave:room', ({ carId }) => {
      if (carId) leaveRoom(socket, carId);
    });

    // 3. Disconnect cleanup
    socket.on('disconnect', () => {
      if (socket.data.currentRoom) {
        leaveRoom(socket, socket.data.currentRoom);
      }
    });
  });

  console.log('⚡ Socket.io real-time server initialized');
  return io;
}

function leaveRoom(socket: TypedSocket, carId: string) {
  socket.leave(carId);
  const presenceSet = roomPresenceMap.get(carId);
  if (presenceSet) {
    presenceSet.delete(socket.id);
    if (presenceSet.size === 0) {
      roomPresenceMap.delete(carId);
    }
  }

  const watcherCount = getWatcherCount(carId);
  io?.to(carId).emit('presence:update', { carId, watcherCount });

  if (socket.data.currentRoom === carId) {
    delete socket.data.currentRoom;
  }
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
}
