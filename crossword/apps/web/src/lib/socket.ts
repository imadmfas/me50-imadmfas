import { io, type Socket } from 'socket.io-client';
import { API_BASE } from './api';

let socket: Socket | null = null;

/**
 * One shared Socket.IO client for the whole app, authenticated via the
 * httpOnly cookie set on username claim. `autoConnect: false` is
 * deliberate: connecting before the cookie exists gets the handshake
 * rejected by the server's auth middleware, and the client won't
 * automatically retry with a *newly available* cookie later — so callers
 * must explicitly connect (see App.tsx, once auth status is
 * 'authenticated') rather than relying on connect-on-construction.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
