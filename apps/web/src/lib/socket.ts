import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@car-auction/shared';

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5001');

export type TypedClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedClientSocket | null = null;

export function getSocket(token?: string | null): TypedClientSocket {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => {
        cb({ token: token || null });
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socket;
}
