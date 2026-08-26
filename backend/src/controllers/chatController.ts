import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { emitToConversation, emitToUser } from '../services/socket';
import { logAuditEvent } from '../services/audit';

const SendMessageSchema = z.object({
  content: z.string().min(1),
});

const StartConversationSchema = z.object({
  productId: z.number().int(),
  initialMessage: z.string().optional(),
});

export async function getConversations(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
    },
    include: {
      product: {
        include: { images: true },
      },
      buyer: {
        select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true },
      },
      seller: {
        select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const formatted = await Promise.all(
    conversations.map(async conv => {
      const otherUser = conv.buyerId === req.user?.id ? conv.seller : conv.buyer;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: req.user?.id },
          isRead: false,
        },
      });

      return {
        id: conv.id,
        productId: conv.productId,
        product: conv.product,
        otherUser,
        lastMessage: conv.messages[0] || null,
        unreadCount,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    })
  );

  return res.json({
    success: true,
    data: formatted,
  });
}

export async function startConversation(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const parsed = StartConversationSchema.parse(req.body);

  const product = await prisma.marketplaceProduct.findUnique({
    where: { id: parsed.productId },
    include: { images: true },
  });

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.sellerId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot initiate a conversation with yourself' });
  }

  // Check if blocked
  const isBlocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: req.user.id, blockedId: product.sellerId },
        { blockerId: product.sellerId, blockedId: req.user.id },
      ],
    },
  });

  if (isBlocked) {
    return res.status(403).json({ success: false, message: 'Cannot start conversation with this user' });
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      productId_buyerId_sellerId: {
        productId: product.id,
        buyerId: req.user.id,
        sellerId: product.sellerId,
      },
    },
    include: {
      product: { include: { images: true } },
      buyer: { select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true } },
      seller: { select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        productId: product.id,
        buyerId: req.user.id,
        sellerId: product.sellerId,
      },
      include: {
        product: { include: { images: true } },
        buyer: { select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true } },
        seller: { select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (parsed.initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: req.user.id,
          content: parsed.initialMessage,
        },
      });
    }
  }

  return res.status(201).json({
    success: true,
    data: conversation,
  });
}

export async function getConversationMessages(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const conversationId = parseInt(req.params.id, 10);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      product: { include: { images: true } },
      buyer: { select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true } },
      seller: { select: { id: true, fullName: true, department: true, semester: true, avatarUrl: true } },
    },
  });

  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // IDOR Guard: User must be buyer or seller
  if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized access to this conversation' });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: {
      sender: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Mark all unread messages from opposite user as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: req.user.id },
      isRead: false,
    },
    data: { isRead: true },
  });

  const otherUser = conversation.buyerId === req.user.id ? conversation.seller : conversation.buyer;

  return res.json({
    success: true,
    data: {
      conversation,
      otherUser,
      messages,
    },
  });
}

export async function sendMessage(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const conversationId = parseInt(req.params.id, 10);
  const parsed = SendMessageSchema.parse(req.body);

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { product: true },
  });

  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  if (conversation.buyerId !== req.user.id && conversation.sellerId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized to send messages in this conversation' });
  }

  const recipientId = conversation.buyerId === req.user.id ? conversation.sellerId : conversation.buyerId;

  // Check if blocked
  const isBlocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: req.user.id, blockedId: recipientId },
        { blockerId: recipientId, blockedId: req.user.id },
      ],
    },
  });

  if (isBlocked) {
    return res.status(403).json({ success: false, message: 'Message blocked by user settings' });
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: req.user.id,
      content: parsed.content,
    },
    include: {
      sender: {
        select: { id: true, fullName: true, avatarUrl: true },
      },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  // Emit realtime message via Socket.io
  emitToConversation(conversationId, 'new_message', message);
  emitToUser(recipientId, 'new_message_notification', {
    conversationId,
    senderName: req.user.fullName,
    content: parsed.content,
    productTitle: conversation.product.title,
  });

  return res.status(201).json({
    success: true,
    data: message,
  });
}

export async function blockUser(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const targetUserId = parseInt(req.body.targetUserId, 10);
  if (targetUserId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot block yourself' });
  }

  const existing = await prisma.blockedUser.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: req.user.id,
        blockedId: targetUserId,
      },
    },
  });

  if (existing) {
    await prisma.blockedUser.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'User unblocked', blocked: false });
  } else {
    await prisma.blockedUser.create({
      data: {
        blockerId: req.user.id,
        blockedId: targetUserId,
      },
    });
    return res.json({ success: true, message: 'User blocked successfully', blocked: true });
  }
}
