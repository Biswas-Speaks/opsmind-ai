import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export const setupSocket = (httpServer: HTTPServer): SocketIOServer => {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Socket client connected: ${socket.id}`);
    }

    socket.on('join', (room: string) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Socket client disconnected: ${socket.id}`);
      }
    });
  });

  return ioInstance;
};

// Global emitter helper that can be imported anywhere
export const emitSocketEvent = (event: string, data: any): void => {
  if (!ioInstance) {
    // Silent fail in tests/development if socket is not active
    return;
  }
  ioInstance.emit(event, data);
};
