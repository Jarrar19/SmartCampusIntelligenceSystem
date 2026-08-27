import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { logAuditEvent } from '../services/audit';
import { emitGlobal, emitToUser } from '../services/socket';

const CreateCourseSchema = z.object({
  courseCode: z.string().min(2),
  title: z.string().min(3),
  description: z.string().optional(),
  department: z.string().min(2),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().min(4),
  courseType: z.enum(['THEORY', 'LAB', 'PROJECT']).default('THEORY'),
  credits: z.number().int().min(1).max(10).default(3),
});

const UpdateCourseSchema = z.object({
  courseCode: z.string().min(2).optional(),
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  department: z.string().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  academicYear: z.string().optional(),
  courseType: z.enum(['THEORY', 'LAB', 'PROJECT']).optional(),
  credits: z.number().int().min(1).max(10).optional(),
  isArchived: z.boolean().optional(),
});


const CreateAnnouncementSchema = z.object({
  title: z.string().min(2),
  content: z.string().min(5),
  attachmentUrl: z.string().optional(),
});

export async function getCourses(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { department, semester, search, myOnly, courseType } = req.query;

  const where: any = {};
  if (department) where.department = String(department);
  if (semester) where.semester = parseInt(String(semester), 10);
  if (courseType) where.courseType = String(courseType).toUpperCase();
  if (search) {
    where.OR = [
      { courseCode: { contains: String(search) } },
      { title: { contains: String(search) } },
      { department: { contains: String(search) } },
    ];
  }

  if (myOnly === 'true') {
    if (req.user.role === 'FACULTY') {
      where.facultyId = req.user.id;
    } else {
      where.enrollments = {
        some: { studentId: req.user.id },
      };
    }
  }

  const courses = await prisma.course.findMany({
    where,
    include: {
      faculty: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          resources: true,
          assignments: true,
        },
      },
      enrollments: {
        where: { studentId: req.user.id },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = courses.map(c => ({
    ...c,
    isEnrolled: c.enrollments.length > 0 || c.facultyId === req.user?.id,
    enrolledCount: c._count.enrollments,
    resourcesCount: c._count.resources,
    assignmentsCount: c._count.assignments,
  }));

  return res.json({
    success: true,
    data: formatted,
  });
}

export async function getCourseById(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      faculty: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
        },
      },
      announcements: {
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      resources: {
        where: {
          OR: [
            { approvalStatus: 'APPROVED' },
            { uploaderId: req.user.id }, // Uploader can see their own pending/rejected
          ],
        },
        include: {
          uploader: {
            select: { id: true, fullName: true, role: true },
          },
          _count: {
            select: { ratings: true, bookmarks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      assignments: {
        include: {
          submissions: {
            where: { studentId: req.user.id },
          },
          _count: {
            select: { submissions: true },
          },
        },
        orderBy: { dueDate: 'asc' },
      },
      enrollments: {
        include: {
          student: {
            select: { id: true, fullName: true, email: true, semester: true, department: true },
          },
        },
      },
    },
  });

  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const isEnrolled = course.enrollments.some(e => e.studentId === req.user?.id) || course.facultyId === req.user.id;

  return res.json({
    success: true,
    data: {
      ...course,
      isEnrolled,
      isOwner: course.facultyId === req.user.id,
      enrolledCount: course.enrollments.length,
    },
  });
}

export async function createCourse(req: Request, res: Response) {
  if (!req.user || req.user.role !== 'FACULTY') {
    return res.status(403).json({ success: false, message: 'Only faculty members can create courses' });
  }

  const parsed = CreateCourseSchema.parse(req.body);

  const course = await prisma.course.create({
    data: {
      ...parsed,
      facultyId: req.user.id,
    },
    include: {
      faculty: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'COURSE_CREATE',
    resourceType: 'COURSE',
    resourceId: course.id,
    ipAddress: req.ip,
    details: { courseCode: course.courseCode, title: course.title },
  });

  return res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: course,
  });
}

export async function updateCourse(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty members and administrators can update courses' });
  }

  const id = parseInt(req.params.id, 10);
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  if (course.facultyId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only edit your own courses' });
  }

  const parsed = UpdateCourseSchema.parse(req.body);
  const updated = await prisma.course.update({
    where: { id },
    data: parsed,
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'COURSE_UPDATE',
    resourceType: 'COURSE',
    resourceId: id,
    ipAddress: req.ip,
    details: parsed,
  });

  return res.json({
    success: true,
    message: 'Course updated successfully',
    data: updated,
  });
}

export async function deleteCourse(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty members and administrators can delete courses' });
  }

  const id = parseInt(req.params.id, 10);
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  if (course.facultyId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only delete your own courses' });
  }

  await prisma.course.delete({
    where: { id },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'COURSE_DELETE',
    resourceType: 'COURSE',
    resourceId: id,
    ipAddress: req.ip,
    details: { courseCode: course.courseCode, title: course.title },
  });

  return res.json({
    success: true,
    message: 'Course deleted successfully',
  });
}


export async function enrollInCourse(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const existing = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: id,
        studentId: req.user.id,
      },
    },
  });

  if (existing) {
    return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      courseId: id,
      studentId: req.user.id,
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'COURSE_ENROLL',
    resourceType: 'COURSE',
    resourceId: id,
    ipAddress: req.ip,
  });

  return res.status(201).json({
    success: true,
    message: `Successfully enrolled in ${course.courseCode}: ${course.title}`,
    data: enrollment,
  });
}

export async function unenrollFromCourse(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);

  const existing = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: id,
        studentId: req.user.id,
      },
    },
  });

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Enrollment not found' });
  }

  await prisma.enrollment.delete({
    where: { id: existing.id },
  });

  return res.json({
    success: true,
    message: 'Successfully unenrolled from course',
  });
}

export async function createAnnouncement(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const courseId = parseInt(req.params.id, 10);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { enrollments: true },
  });

  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  // Only course faculty can create announcements
  if (course.facultyId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Only the course instructor can post announcements' });
  }

  const parsed = CreateAnnouncementSchema.parse(req.body);

  const announcement = await prisma.announcement.create({
    data: {
      courseId,
      authorId: req.user.id,
      title: parsed.title,
      content: parsed.content,
      attachmentUrl: parsed.attachmentUrl,
    },
    include: {
      author: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  // Batch notify all enrolled students in a single DB operation
  if (course.enrollments.length > 0) {
    await prisma.notification.createMany({
      data: course.enrollments.map((enrollment) => ({
        userId: enrollment.studentId,
        title: `New Announcement in ${course.courseCode}`,
        message: `${announcement.title}: ${announcement.content.substring(0, 80)}...`,
        type: 'ACADEMIC',
        link: `/courses/${course.id}`,
      })),
    });

    course.enrollments.forEach((enrollment) => {
      emitToUser(enrollment.studentId, 'notification', {
        title: `New Announcement in ${course.courseCode}`,
        message: announcement.title,
      });
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Announcement posted successfully',
    data: announcement,
  });
}

export async function getCourseRoster(req: Request, res: Response, next: any) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const courseId = parseInt(req.params.id, 10);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                prn: true,
                department: true,
                semester: true,
                sem1Cgpa: true,
                sem6Cgpa: true,
                tenthPercentage: true,
                twelfthPercentage: true,
                createdAt: true,
              },
            },
          },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const roster = course.enrollments.map(e => ({
      enrollmentId: e.id,
      enrolledAt: e.enrolledAt,
      ...e.student,
    }));

    return res.json({
      success: true,
      data: {
        courseId: course.id,
        courseCode: course.courseCode,
        title: course.title,
        courseType: course.courseType,
        credits: course.credits,
        totalStudents: roster.length,
        students: roster,
      },
    });
  } catch (error) {
    next(error);
  }
}
