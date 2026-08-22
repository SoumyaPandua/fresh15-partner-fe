import { io, type Socket } from "socket.io-client";
import { API_BASE } from "./api-client";

/**
 * Single shared socket.io connection for the whole app.
 * Never create a second connection — always go through getSocket().
 */
let socket: Socket | null = null;
let currentToken: string | null = null;

export function getSocket(token: string): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() is browser-only");
  }
  if (socket && currentToken === token) return socket;
  if (socket) disconnectSocket();

  currentToken = token;
  socket = io(API_BASE, {
    transports: ["websocket", "polling"],
    auth: { token },
    // auto reconnect
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });
  return socket;
}

export function getExistingSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  currentToken = null;
}
