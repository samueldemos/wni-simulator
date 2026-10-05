import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@wni/shared';

// Server URL: in dev defaults to localhost:3001; override via VITE_SERVER_URL.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): GameSocket {
  return io(SERVER_URL, { autoConnect: true });
}
