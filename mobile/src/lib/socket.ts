import { io, Socket } from 'socket.io-client';
import { secureStorage } from './secure-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await secureStorage.getToken();

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export { socket };
