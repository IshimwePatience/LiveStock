import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

export function connectSocket(options = {}) {
  return io(SOCKET_URL, options);
}
