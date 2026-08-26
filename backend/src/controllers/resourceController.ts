import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { saveBufferToFile, resolveFilePath } from '../services/fileStorage';
import { logAuditEvent } from '../services/audit';
import { emitToUser } from '../services/socket';

const ModerationActionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  rejectionReason: z.string().optional(),
});


export async function uploadResource(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File is required' });
  }

  const {
    title,
    description,
    category = 'NOTES',
    courseId,
    subjectCode,
    department,
    semester,
    tags,
  } = req.body;

  if (!title || title.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Resource title is required' });
  }

  try {
    const saved = saveBufferToFile(req.file.buffer, 'resources', req.file.originalname);

    // Faculty uploads are auto-approved. Student uploads enter PENDING_REVIEW
    const isFacultyOrAdmin = req.user.role === 'FACULTY' || req.user.role === 'ADMIN';
    const approvalStatus = isFacultyOrAdmin ? 'APPROVED' : 'PENDING_REVIEW';

    const parsedCourseId = courseId && courseId !== 'null' ? parseInt(courseId, 10) : null;
    const parsedSemester = semester && semester !== 'null' ? parseInt(semester, 10) : null;

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        category,
        filePath: saved.relativePath,
        fileName: saved.fileName,
        fileSize: saved.fileSize,
        mimeType: req.file.mimetype || 'application/octet-stream',
        fileHash: saved.fileHash,
        uploaderId: req.user.id,
        uploaderRole: req.user.role,
        approvalStatus,
        reviewerId: isFacultyOrAdmin ? req.user.id : null,
        reviewedAt: isFacultyOrAdmin ? new Date() : null,
        courseId: parsedCourseId,
        subjectCode: subjectCode || null,
        department: department || null,
        semester: parsedSemester,
        tags: tags || null,
      },
      include: {
        uploader: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'RESOURCE_UPLOAD',
      resourceType: 'RESOURCE',
      resourceId: resource.id,
      ipAddress: req.ip,
      details: { title: resource.title, category: resource.category, approvalStatus },
    });

    return res.status(201).json({
      success: true,
      message: isFacultyOrAdmin
        ? 'Resource uploaded and published successfully!'
        : 'Resource uploaded successfully and submitted for faculty moderation (Status: Pending Review).',
      data: resource,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'File upload failed' });
  }
}

export async function getResources(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const {
    category,
    courseId,
    subjectCode,
    department,
    semester,
    uploaderRole,
    search,
    sort = 'newest',
    myUploads,
    bookmarkedOnly,
  } = req.query;

  const where: any = {};

  // For public listing, only show APPROVED resources, unless filtering by myUploads
  if (myUploads === 'true') {
    where.uploaderId = req.user.id;
  } else {
    where.approvalStatus = 'APPROVED';
  }

  if (category) where.category = String(category);
  if (courseId) where.courseId = parseInt(String(courseId), 10);
  if (subjectCode) where.subjectCode = { contains: String(subjectCode) };
  if (department) where.department = String(department);
  if (semester) where.semester = parseInt(String(semester), 10);
  if (uploaderRole) where.uploaderRole = String(uploaderRole);

  if (search) {
    const q = String(search);
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { subjectCode: { contains: q } },
      { tags: { contains: q } },
    ];
  }

  if (bookmarkedOnly === 'true') {
    where.bookmarks = {
      some: { userId: req.user.id },
    };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'downloads') orderBy = { downloadsCount: 'desc' };
  if (sort === 'views') orderBy = { viewsCount: 'desc' };

  const resources = await prisma.resource.findMany({
    where,
    include: {
      uploader: {
        select: { id: true, fullName: true, role: true, department: true },
      },
      reviewer: {
        select: { id: true, fullName: true, role: true },
      },
      course: {
        select: { id: true, courseCode: true, title: true },
      },
      ratings: {
        where: { isHelpful: true },
        select: { id: true },
      },
      bookmarks: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
    orderBy,
    take: 100,
  });

  const formatted = resources.map(r => ({
    ...r,
    helpfulCount: r.ratings.length,
    isBookmarked: r.bookmarks.length > 0,
  }));

  return res.json({
    success: true,
    data: formatted,
  });
}

export async function getResourceById(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      uploader: {
        select: { id: true, fullName: true, role: true, department: true },
      },
      reviewer: {
        select: { id: true, fullName: true, role: true },
      },
      course: {
        select: { id: true, courseCode: true, title: true },
      },
      ratings: {
        where: { isHelpful: true },
        select: { id: true, userId: true },
      },
      bookmarks: {
        where: { userId: req.user.id },
        select: { id: true },
      },
    },
  });

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  // Check authorization to view pending/rejected items
  if (
    resource.approvalStatus !== 'APPROVED' &&
    resource.uploaderId !== req.user.id &&
    req.user.role !== 'FACULTY' &&
    req.user.role !== 'ADMIN'
  ) {
    return res.status(403).json({ success: false, message: 'Resource is currently pending faculty moderation' });
  }

  // Increment view count
  await prisma.resource.update({
    where: { id },
    data: { viewsCount: { increment: 1 } },
  });

  return res.json({
    success: true,
    data: {
      ...resource,
      helpfulCount: resource.ratings.length,
      isBookmarked: resource.bookmarks.length > 0,
      userRating: resource.ratings.some(r => r.userId === req.user?.id),
    },
  });
}

export async function downloadResource(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const resource = await prisma.resource.findUnique({ where: { id } });

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  if (
    resource.approvalStatus !== 'APPROVED' &&
    resource.uploaderId !== req.user.id &&
    req.user.role !== 'FACULTY' &&
    req.user.role !== 'ADMIN'
  ) {
    return res.status(403).json({ success: false, message: 'Access denied: Resource is awaiting moderation' });
  }

  try {
    const fullPath = resolveFilePath(resource.filePath);

    // Increment download count
    await prisma.resource.update({
      where: { id },
      data: { downloadsCount: { increment: 1 } },
    });

    return res.download(fullPath, resource.fileName);
  } catch (error: any) {
    return res.status(404).json({ success: false, message: 'File not found on storage' });
  }
}

export async function getModerationQueue(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can view moderation queue' });
  }

  const { status = 'PENDING_REVIEW' } = req.query;

  const resources = await prisma.resource.findMany({
    where: {
      approvalStatus: String(status),
    },
    include: {
      uploader: {
        select: { id: true, fullName: true, email: true, role: true, department: true, semester: true },
      },
      course: {
        select: { id: true, courseCode: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    success: true,
    data: resources,
  });
}

export async function moderateResource(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can moderate resources' });
  }

  const id = parseInt(req.params.id, 10);
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { uploader: true },
  });

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  const parsed = ModerationActionSchema.parse(req.body);

  if ((parsed.status === 'REJECTED' || parsed.status === 'CHANGES_REQUESTED') && (!parsed.rejectionReason || parsed.rejectionReason.trim().length === 0)) {
    return res.status(400).json({ success: false, message: `Feedback / reason is required when status is set to ${parsed.status}` });
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: {
      approvalStatus: parsed.status,
      rejectionReason: parsed.status !== 'APPROVED' ? parsed.rejectionReason : null,
      reviewerId: req.user.id,
      reviewedAt: new Date(),
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: `RESOURCE_${parsed.status}`,
    resourceType: 'RESOURCE',
    resourceId: id,
    ipAddress: req.ip,
    details: { title: resource.title, uploaderId: resource.uploaderId, reason: parsed.rejectionReason },
  });

  // Notify student uploader
  const actionTitle = parsed.status === 'APPROVED' ? 'Approved' : parsed.status === 'CHANGES_REQUESTED' ? 'Revision Requested' : 'Rejected';
  const actionMsg = parsed.status === 'APPROVED'
    ? `Your upload "${resource.title}" has been verified and published to the academic hub.`
    : parsed.status === 'CHANGES_REQUESTED'
    ? `Revision requested for "${resource.title}". Feedback: ${parsed.rejectionReason}`
    : `Your upload "${resource.title}" was rejected. Reason: ${parsed.rejectionReason}`;

  await prisma.notification.create({
    data: {
      userId: resource.uploaderId,
      title: `Resource ${actionTitle}: ${resource.title}`,
      message: actionMsg,
      type: 'MODERATION',
      link: `/resources/${resource.id}`,
    },
  });

  emitToUser(resource.uploaderId, 'notification', {
    title: `Resource ${actionTitle}`,
    message: resource.title,
  });

  return res.json({
    success: true,
    message: `Resource status has been updated to ${parsed.status}`,
    data: updated,
  });
}


export async function toggleRating(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const resourceId = parseInt(req.params.id, 10);
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

  const existing = await prisma.resourceRating.findUnique({
    where: {
      resourceId_userId: {
        resourceId,
        userId: req.user.id,
      },
    },
  });

  if (existing) {
    await prisma.resourceRating.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Rating removed', rated: false });
  } else {
    await prisma.resourceRating.create({
      data: {
        resourceId,
        userId: req.user.id,
        isHelpful: true,
      },
    });
    return res.json({ success: true, message: 'Marked as helpful', rated: true });
  }
}

export async function toggleBookmark(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const resourceId = parseInt(req.params.id, 10);
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

  const existing = await prisma.resourceBookmark.findUnique({
    where: {
      resourceId_userId: {
        resourceId,
        userId: req.user.id,
      },
    },
  });

  if (existing) {
    await prisma.resourceBookmark.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: 'Bookmark removed', bookmarked: false });
  } else {
    await prisma.resourceBookmark.create({
      data: {
        resourceId,
        userId: req.user.id,
      },
    });
    return res.json({ success: true, message: 'Resource saved to bookmarks', bookmarked: true });
  }
}

export async function deleteResource(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const resource = await prisma.resource.findUnique({ where: { id } });
  if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

  // Only uploader or admin can delete
  if (resource.uploaderId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only delete your own uploaded resources' });
  }

  await prisma.resource.delete({ where: { id } });

  await logAuditEvent({
    userId: req.user.id,
    action: 'RESOURCE_DELETE',
    resourceType: 'RESOURCE',
    resourceId: id,
    ipAddress: req.ip,
  });

  return res.json({ success: true, message: 'Resource deleted successfully' });
}
