import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';

const CreateNoticeSchema = z.object({
  title: z.string().min(3, 'Notice title must be at least 3 characters'),
  content: z.string().min(5, 'Notice content must be at least 5 characters'),
  category: z.enum(['GENERAL', 'ACADEMIC', 'EVENT', 'EXAM', 'EMERGENCY', 'CULTURAL', 'SPORTS']).default('GENERAL'),
  priority: z.enum(['NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  location: z.string().optional(),
  eventDate: z.string().optional(),
  expiresInHours: z.number().positive().default(24),
  expiresAt: z.string().optional(),
});

export async function getNotices(req: Request, res: Response) {
  try {
    const now = new Date();

    // 1. Self-deletion: Auto-purge any notices that have passed their expiration timestamp
    await prisma.campusNotice.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const category = req.query.category ? String(req.query.category).toUpperCase() : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;

    const whereClause: any = {
      expiresAt: { gte: now },
    };

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const notices = await prisma.campusNotice.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
            department: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return res.json({
      success: true,
      data: notices,
    });
  } catch (err: any) {
    console.error('Error fetching campus notices:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notice board announcements',
    });
  }
}

export async function createNotice(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Authorizing creation ONLY for Faculty, HoD, and Admin roles
  const isAuthorized = ['FACULTY', 'HOD', 'ADMIN'].includes(req.user.role);
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: 'Only Faculty, HoD, and Admin users are authorized to publish campus notices.',
    });
  }

  try {
    const parsed = CreateNoticeSchema.parse(req.body);
    const now = new Date();

    let expiresAtDate: Date;
    if (parsed.expiresAt) {
      expiresAtDate = new Date(parsed.expiresAt);
    } else {
      expiresAtDate = new Date(now.getTime() + parsed.expiresInHours * 60 * 60 * 1000);
    }

    const eventDateParsed = parsed.eventDate ? new Date(parsed.eventDate) : undefined;

    const notice = await prisma.campusNotice.create({
      data: {
        title: parsed.title,
        content: parsed.content,
        category: parsed.category,
        priority: parsed.priority,
        location: parsed.location || null,
        eventDate: eventDateParsed || null,
        expiresAt: expiresAtDate,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
            department: true,
          },
        },
      },
    });

    // Send notifications to students if notice is Urgent or High Priority
    if (['HIGH', 'URGENT'].includes(parsed.priority)) {
      try {
        const students = await prisma.user.findMany({
          where: { role: 'STUDENT', isActive: true },
          select: { id: true },
        });

        if (students.length > 0) {
          const notificationsData = students.map((s) => ({
            userId: s.id,
            title: `📢 ${parsed.priority === 'URGENT' ? 'URGENT NOTICE' : 'Campus Notice'}: ${parsed.title}`,
            message: parsed.content.substring(0, 120) + (parsed.content.length > 120 ? '...' : ''),
            type: 'NOTICE',
            link: '/notice-board',
          }));

          await prisma.notification.createMany({
            data: notificationsData,
          });
        }
      } catch (notifErr) {
        console.error('Non-critical notification emit error:', notifErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Campus notice published successfully',
      data: notice,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: err.errors[0]?.message || 'Validation error',
      });
    }
    console.error('Error creating campus notice:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create campus notice',
    });
  }
}

export async function deleteNotice(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const noticeId = parseInt(id, 10);

  if (isNaN(noticeId)) {
    return res.status(400).json({ success: false, message: 'Invalid notice ID' });
  }

  try {
    const notice = await prisma.campusNotice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const isAuthor = notice.authorId === req.user.id;
    const isStaffAdmin = ['HOD', 'ADMIN'].includes(req.user.role);

    if (!isAuthor && !isStaffAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this notice.',
      });
    }

    await prisma.campusNotice.delete({
      where: { id: noticeId },
    });

    return res.json({
      success: true,
      message: 'Campus notice deleted successfully',
    });
  } catch (err: any) {
    console.error('Error deleting notice:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete campus notice',
    });
  }
}
