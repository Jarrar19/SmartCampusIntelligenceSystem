import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { saveBufferToFile, resolveFilePath } from '../services/fileStorage';
import { logAuditEvent } from '../services/audit';
import { emitToUser } from '../services/socket';
import { config } from '../config';

const CreateProductSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.string().default('OTHER'),
  price: z.preprocess(val => parseFloat(String(val)), z.number().min(0)),
  condition: z.string().default('GOOD'),
  campusInfo: z.string().optional(),
});

const UpdateProductSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  category: z.string().optional(),
  price: z.preprocess(val => val !== undefined ? parseFloat(String(val)) : undefined, z.number().min(0).optional()),
  condition: z.string().optional(),
  campusInfo: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'REMOVED']).optional(),
});

export async function getProducts(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const {
    category,
    condition,
    minPrice,
    maxPrice,
    status = 'AVAILABLE',
    search,
    sort = 'newest',
    sellerId,
  } = req.query;

  const where: any = {
    moderationStatus: 'APPROVED',
  };

  if (status !== 'ALL') {
    where.status = String(status);
  }

  if (category) where.category = String(category);
  if (condition) where.condition = String(condition);
  if (sellerId) where.sellerId = parseInt(String(sellerId), 10);

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(String(minPrice));
    if (maxPrice) where.price.lte = parseFloat(String(maxPrice));
  }

  if (search) {
    const q = String(search);
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { campusInfo: { contains: q } },
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };

  const products = await prisma.marketplaceProduct.findMany({
    where,
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          department: true,
          semester: true,
          avatarUrl: true,
        },
      },
      images: {
        orderBy: { isPrimary: 'desc' },
      },
      favorites: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
    orderBy,
    take: 100,
  });

  const formatted = products.map(p => ({
    ...p,
    isFavorited: p.favorites.length > 0,
    isMine: p.sellerId === req.user?.id,
  }));

  return res.json({
    success: true,
    data: formatted,
  });
}

export async function getProductById(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const product = await prisma.marketplaceProduct.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          department: true,
          semester: true,
          avatarUrl: true,
        },
      },
      images: true,
      favorites: {
        where: { userId: req.user.id },
        select: { id: true },
      },
      purchaseRequests: {
        where: { buyerId: req.user.id },
        orderBy: { createdAt: 'desc' },
      },
      conversations: {
        where: {
          OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
        },
        select: { id: true },
      },
    },
  });

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Increment views count
  await prisma.marketplaceProduct.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  });

  return res.json({
    success: true,
    data: {
      ...product,
      isFavorited: product.favorites.length > 0,
      isMine: product.sellerId === req.user.id,
      activeRequest: product.purchaseRequests[0] || null,
      existingConversationId: product.conversations[0]?.id || null,
    },
  });
}

export async function createProduct(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const parsed = CreateProductSchema.parse(req.body);

  const product = await prisma.marketplaceProduct.create({
    data: {
      sellerId: req.user.id,
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      price: parsed.price,
      condition: parsed.condition,
      campusInfo: parsed.campusInfo,
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
    },
  });

  // Handle uploaded images if any
  const files = req.files as Express.Multer.File[];
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const saved = saveBufferToFile(file.buffer, 'marketplace', file.originalname, config.ALLOWED_IMAGE_EXTENSIONS);
        await prisma.productImage.create({
          data: {
            productId: product.id,
            imagePath: saved.relativePath,
            isPrimary: i === 0,
          },
        });
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }
  }

  await logAuditEvent({
    userId: req.user.id,
    action: 'MARKETPLACE_CREATE_PRODUCT',
    resourceType: 'PRODUCT',
    resourceId: product.id,
    ipAddress: req.ip,
    details: { title: product.title, price: product.price, category: product.category },
  });

  const fullProduct = await prisma.marketplaceProduct.findUnique({
    where: { id: product.id },
    include: { images: true, seller: true },
  });

  return res.status(201).json({
    success: true,
    message: 'Listing created successfully on Campus Marketplace',
    data: fullProduct,
  });
}

export async function updateProduct(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const product = await prisma.marketplaceProduct.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only edit your own listings' });
  }

  const parsed = UpdateProductSchema.parse(req.body);

  const updated = await prisma.marketplaceProduct.update({
    where: { id },
    data: parsed,
    include: { images: true },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'MARKETPLACE_UPDATE_PRODUCT',
    resourceType: 'PRODUCT',
    resourceId: id,
    ipAddress: req.ip,
    details: parsed,
  });

  return res.json({
    success: true,
    message: 'Listing updated successfully',
    data: updated,
  });
}

export async function deleteProduct(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const product = await prisma.marketplaceProduct.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.sellerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only delete your own listings' });
  }

  await prisma.marketplaceProduct.delete({ where: { id } });

  await logAuditEvent({
    userId: req.user.id,
    action: 'MARKETPLACE_DELETE_PRODUCT',
    resourceType: 'PRODUCT',
    resourceId: id,
    ipAddress: req.ip,
  });

  return res.json({
    success: true,
    message: 'Listing removed from marketplace',
  });
}

export async function toggleFavorite(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const productId = parseInt(req.params.id, 10);
  const product = await prisma.marketplaceProduct.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const existing = await prisma.marketplaceFavorite.findUnique({
    where: {
      productId_userId: {
        productId,
        userId: req.user.id,
      },
    },
  });

  if (existing) {
    await prisma.marketplaceFavorite.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Removed from wishlist', favorited: false });
  } else {
    await prisma.marketplaceFavorite.create({
      data: {
        productId,
        userId: req.user.id,
      },
    });
    return res.json({ success: true, message: 'Saved to wishlist', favorited: true });
  }
}

export async function createPurchaseRequest(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const productId = parseInt(req.params.id, 10);
  const { message } = req.body;

  const product = await prisma.marketplaceProduct.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (product.sellerId === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot request to buy your own listed product' });
  }

  if (product.status !== 'AVAILABLE') {
    return res.status(400).json({ success: false, message: `Product is currently ${product.status.toLowerCase()}` });
  }

  const existing = await prisma.purchaseRequest.findFirst({
    where: {
      productId,
      buyerId: req.user.id,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
  });

  if (existing) {
    return res.status(400).json({ success: false, message: 'You already have an active request for this item' });
  }

  const request = await prisma.purchaseRequest.create({
    data: {
      productId,
      buyerId: req.user.id,
      sellerId: product.sellerId,
      message: message || null,
      status: 'PENDING',
    },
    include: {
      product: true,
      buyer: {
        select: { id: true, fullName: true, department: true, semester: true },
      },
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'MARKETPLACE_PURCHASE_REQUEST',
    resourceType: 'PURCHASE_REQUEST',
    resourceId: request.id,
    ipAddress: req.ip,
    details: { productId, sellerId: product.sellerId },
  });

  // Notify Seller
  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      title: `New Purchase Request: ${product.title}`,
      message: `${req.user.fullName} has requested to buy your "${product.title}" (₹${product.price}).`,
      type: 'MARKETPLACE',
      link: `/marketplace/requests`,
    },
  });

  emitToUser(product.sellerId, 'notification', {
    title: `New Purchase Request: ${product.title}`,
    message: `${req.user.fullName} wants to buy your item.`,
  });

  return res.status(201).json({
    success: true,
    message: 'Purchase request sent to seller successfully!',
    data: request,
  });
}

export async function updatePurchaseRequestStatus(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const requestId = parseInt(req.params.requestId, 10);
  const { status } = req.body; // ACCEPTED, REJECTED, COMPLETED, CANCELLED

  const request = await prisma.purchaseRequest.findUnique({
    where: { id: requestId },
    include: { product: true, buyer: true, seller: true },
  });

  if (!request) return res.status(404).json({ success: false, message: 'Purchase request not found' });

  const isSeller = request.sellerId === req.user.id;
  const isBuyer = request.buyerId === req.user.id;

  if (!isSeller && !isBuyer && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Unauthorized to modify this request' });
  }

  if (status === 'CANCELLED' && !isBuyer && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only the buyer can cancel the request' });
  }

  if ((status === 'ACCEPTED' || status === 'REJECTED') && !isSeller && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only the seller can accept or reject this request' });
  }

  const updatedRequest = await prisma.purchaseRequest.update({
    where: { id: requestId },
    data: { status },
  });

  // State transitions on Product
  if (status === 'ACCEPTED') {
    await prisma.marketplaceProduct.update({
      where: { id: request.productId },
      data: { status: 'RESERVED' },
    });
  } else if (status === 'COMPLETED') {
    await prisma.marketplaceProduct.update({
      where: { id: request.productId },
      data: { status: 'SOLD' },
    });
  } else if (status === 'REJECTED' || status === 'CANCELLED') {
    // If product was reserved for this request, revert back to AVAILABLE
    if (request.product.status === 'RESERVED') {
      await prisma.marketplaceProduct.update({
        where: { id: request.productId },
        data: { status: 'AVAILABLE' },
      });
    }
  }

  await logAuditEvent({
    userId: req.user.id,
    action: `PURCHASE_REQUEST_${status}`,
    resourceType: 'PURCHASE_REQUEST',
    resourceId: requestId,
    ipAddress: req.ip,
    details: { productId: request.productId, status },
  });

  // Notify opposite party
  const notifyUserId = isSeller ? request.buyerId : request.sellerId;
  const notifyTitle = `Purchase Request ${status}: ${request.product.title}`;
  const notifyMessage = isSeller
    ? `Seller ${req.user.fullName} has ${status.toLowerCase()} your request for "${request.product.title}".`
    : `Buyer ${req.user.fullName} has ${status.toLowerCase()} the request for "${request.product.title}".`;

  await prisma.notification.create({
    data: {
      userId: notifyUserId,
      title: notifyTitle,
      message: notifyMessage,
      type: 'MARKETPLACE',
      link: `/marketplace/products/${request.productId}`,
    },
  });

  emitToUser(notifyUserId, 'notification', {
    title: notifyTitle,
    message: notifyMessage,
  });

  return res.json({
    success: true,
    message: `Purchase request marked as ${status}`,
    data: updatedRequest,
  });
}

export async function getMyPurchaseRequests(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { type = 'received' } = req.query; // 'sent' or 'received'

  const whereClause = type === 'sent' ? { buyerId: req.user.id } : { sellerId: req.user.id };

  const requests = await prisma.purchaseRequest.findMany({
    where: whereClause,
    include: {
      product: {
        include: { images: true },
      },
      buyer: {
        select: { id: true, fullName: true, department: true, semester: true },
      },
      seller: {
        select: { id: true, fullName: true, department: true, semester: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    data: requests,
  });
}

export async function createReport(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { targetType, targetId, reason } = req.body;
  if (!targetType || !targetId || !reason || reason.trim().length < 5) {
    return res.status(400).json({ success: false, message: 'Target type, ID, and descriptive reason are required' });
  }

  const report = await prisma.report.create({
    data: {
      reporterId: req.user.id,
      targetType,
      targetId: String(targetId),
      reason: reason.trim(),
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'SAFETY_REPORT_FILED',
    resourceType: targetType,
    resourceId: targetId,
    ipAddress: req.ip,
    details: { reason },
  });

  return res.status(201).json({
    success: true,
    message: 'Report submitted to campus moderation team for review.',
    data: report,
  });
}
