import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  department: z.string().optional(),
  semester: z.number().int().optional(),
  avatarUrl: z.string().optional(),
});

export async function updateProfile(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const parsed = UpdateProfileSchema.parse(req.body);

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: parsed,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      semester: true,
      avatarUrl: true,
      isVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  return res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updated,
  });
}

export async function getNotifications(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: req.user.id, isRead: false },
  });

  return res.json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
}

export async function markNotificationRead(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { id } = req.params;
  if (id === 'all') {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return res.json({ success: true, message: 'All notifications marked as read' });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });

  return res.json({ success: true, message: 'Notification marked as read' });
}

export async function getAuditLogs(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // Students see their own audit logs, faculty/admin see relevant system logs
  const whereClause = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return res.json({
    success: true,
    data: logs,
  });
}

export async function getDashboardStats(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  if (req.user.role === 'STUDENT') {
    const enrolledCoursesCount = await prisma.enrollment.count({
      where: { studentId: req.user.id },
    });

    const pendingAssignmentsCount = await prisma.assignment.count({
      where: {
        course: {
          enrollments: {
            some: { studentId: req.user.id },
          },
        },
        submissions: {
          none: { studentId: req.user.id },
        },
        dueDate: { gt: new Date() },
      },
    });

    const myResourcesCount = await prisma.resource.count({
      where: { uploaderId: req.user.id },
    });

    const activeListingsCount = await prisma.marketplaceProduct.count({
      where: { sellerId: req.user.id, status: 'AVAILABLE' },
    });

    const unreadMessagesCount = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
        },
        senderId: { not: req.user.id },
        isRead: false,
      },
    });

    return res.json({
      success: true,
      data: {
        role: 'STUDENT',
        enrolledCoursesCount,
        pendingAssignmentsCount,
        myResourcesCount,
        activeListingsCount,
        unreadMessagesCount,
      },
    });
  } else {
    // FACULTY
    const coursesTaughtCount = await prisma.course.count({
      where: { facultyId: req.user.id, isArchived: false },
    });

    const pendingModerationCount = await prisma.resource.count({
      where: { approvalStatus: 'PENDING_REVIEW' },
    });

    const pendingSubmissionsToGrade = await prisma.submission.count({
      where: {
        status: 'SUBMITTED',
        assignment: { facultyId: req.user.id },
      },
    });

    const totalStudentsEnrolled = await prisma.enrollment.count({
      where: {
        course: { facultyId: req.user.id },
      },
    });

    return res.json({
      success: true,
      data: {
        role: 'FACULTY',
        coursesTaughtCount,
        pendingModerationCount,
        pendingSubmissionsToGrade,
        totalStudentsEnrolled,
      },
    });
  }
}
