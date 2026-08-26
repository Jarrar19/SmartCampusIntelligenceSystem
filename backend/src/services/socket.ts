import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from './prisma';

interface SocketUser {
  userId: number;
  email: string;
  role: string;
}

let io: SocketIOServer | null = null;
const userSockets = new Map<number, Set<string>>();

export function initSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required for socket connection'));
    }

    try {
      const decoded = jwt.verify(String(token), config.JWT_SECRET) as SocketUser;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as SocketUser;
    if (!user) return;

    if (!userSockets.has(user.userId)) {
      userSockets.set(user.userId, new Set());
    }
    userSockets.get(user.userId)?.add(socket.id);

    // Join user's personal room for direct notifications
    socket.join(`user:${user.userId}`);

    socket.on('join_conversation', async (conversationId: number) => {
      try {
        const conv = await prisma.conversation.findUnique({
          where: { id: Number(conversationId) },
          select: { buyerId: true, sellerId: true },
        });

        if (conv && (conv.buyerId === user.userId || conv.sellerId === user.userId)) {
          socket.join(`conversation:${conversationId}`);
        } else {
          socket.emit('socket_error', { message: 'Unauthorized access to conversation room' });
        }
      } catch (err) {
        socket.emit('socket_error', { message: 'Failed to join conversation room' });
      }
    });

    socket.on('leave_conversation', (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(user.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(user.userId);
        }
      }
    });
  });

  return io;
}

export function emitToUser(userId: number, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToConversation(conversationId: number, event: string, data: any) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

export function emitGlobal(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
