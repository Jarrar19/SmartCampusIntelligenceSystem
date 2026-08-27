import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { saveBufferToFile, resolveFilePath } from '../services/fileStorage';
import { logAuditEvent } from '../services/audit';
import { emitToUser } from '../services/socket';

const CreateAssignmentSchema = z.object({
  courseId: z.number().int(),
  title: z.string().min(3),
  description: z.string().min(5),
  attachmentUrl: z.string().optional(),
  maxMarks: z.number().positive().default(100.0),
  dueDate: z.string().transform(str => new Date(str)),
  allowLate: z.boolean().default(true),
});

const GradeSubmissionSchema = z.object({
  marksAwarded: z.number().min(0),
  facultyFeedback: z.string().optional(),
  status: z.enum(['GRADED', 'RETURNED', 'SUBMITTED', 'PENDING']).optional().default('GRADED'),
});

const UpdateAssignmentSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),
  attachmentUrl: z.string().optional(),
  maxMarks: z.number().positive().optional(),
  dueDate: z.string().transform(str => new Date(str)).optional(),
  allowLate: z.boolean().optional(),
});


export async function createAssignment(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can create assignments' });
  }

  const parsed = CreateAssignmentSchema.parse(req.body);

  const course = await prisma.course.findUnique({
    where: { id: parsed.courseId },
    include: { enrollments: true },
  });

  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
  if (course.facultyId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only create assignments for your own courses' });
  }

  const assignment = await prisma.assignment.create({
    data: {
      courseId: parsed.courseId,
      facultyId: req.user.id,
      title: parsed.title,
      description: parsed.description,
      attachmentUrl: parsed.attachmentUrl,
      maxMarks: parsed.maxMarks,
      dueDate: parsed.dueDate,
      allowLate: parsed.allowLate,
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'ASSIGNMENT_CREATE',
    resourceType: 'ASSIGNMENT',
    resourceId: assignment.id,
    ipAddress: req.ip,
    details: { title: assignment.title, courseId: course.id },
  });

  // Notify all enrolled students
  for (const enrollment of course.enrollments) {
    await prisma.notification.create({
      data: {
        userId: enrollment.studentId,
        title: `New Assignment in ${course.courseCode}`,
        message: `${assignment.title} (Due: ${assignment.dueDate.toLocaleDateString()})`,
        type: 'ASSIGNMENT',
        link: `/assignments/${assignment.id}`,
      },
    });
    emitToUser(enrollment.studentId, 'notification', {
      title: `New Assignment in ${course.courseCode}`,
      message: assignment.title,
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Assignment created successfully',
    data: assignment,
  });
}

export async function getAssignmentById(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const id = parseInt(req.params.id, 10);
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: {
        select: { id: true, courseCode: true, title: true, facultyId: true },
      },
      submissions: req.user.role === 'FACULTY'
        ? {
            include: {
              student: {
                select: { id: true, fullName: true, email: true, semester: true, department: true },
              },
            },
            orderBy: { submittedAt: 'desc' },
          }
        : {
            where: { studentId: req.user.id },
          },
    },
  });

  if (!assignment) {
    return res.status(404).json({ success: false, message: 'Assignment not found' });
  }

  const mySubmission = req.user.role === 'STUDENT' && assignment.submissions.length > 0
    ? assignment.submissions[0]
    : null;

  return res.json({
    success: true,
    data: {
      ...assignment,
      mySubmission,
      submissionsCount: assignment.submissions.length,
    },
  });
}

export async function updateAssignment(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can update assignments' });
  }

  const id = parseInt(req.params.id, 10);
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  if (assignment.course.facultyId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only edit assignments for your own courses' });
  }

  const parsed = UpdateAssignmentSchema.parse(req.body);
  const updated = await prisma.assignment.update({
    where: { id },
    data: parsed,
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'ASSIGNMENT_UPDATE',
    resourceType: 'ASSIGNMENT',
    resourceId: id,
    ipAddress: req.ip,
    details: parsed,
  });

  return res.json({
    success: true,
    message: 'Assignment updated successfully',
    data: updated,
  });
}

export async function deleteAssignment(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can delete assignments' });
  }

  const id = parseInt(req.params.id, 10);
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
  if (assignment.course.facultyId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only delete assignments for your own courses' });
  }

  await prisma.assignment.delete({
    where: { id },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'ASSIGNMENT_DELETE',
    resourceType: 'ASSIGNMENT',
    resourceId: id,
    ipAddress: req.ip,
    details: { title: assignment.title, courseId: assignment.courseId },
  });

  return res.json({
    success: true,
    message: 'Assignment deleted successfully',
  });
}


export async function submitAssignment(req: Request, res: Response) {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Only students can submit assignments' });
  }

  const assignmentId = parseInt(req.params.id, 10);
  const { submissionText } = req.body;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });

  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

  const now = new Date();
  const isLate = now > assignment.dueDate;

  if (isLate && !assignment.allowLate) {
    return res.status(400).json({
      success: false,
      message: 'Deadline has passed and late submissions are not allowed for this assignment.',
    });
  }

  let fileInfo: any = {};
  if (req.file) {
    try {
      const saved = saveBufferToFile(req.file.buffer, 'assignments', req.file.originalname);
      fileInfo = {
        filePath: saved.relativePath,
        fileName: saved.fileName,
        fileSize: saved.fileSize,
      };
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // Create or Update existing submission (resubmit before grading)
  const existing = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId: req.user.id,
      },
    },
  });

  let submission;
  if (existing) {
    submission = await prisma.submission.update({
      where: { id: existing.id },
      data: {
        submissionText: submissionText || existing.submissionText,
        filePath: fileInfo.filePath || existing.filePath,
        fileName: fileInfo.fileName || existing.fileName,
        fileSize: fileInfo.fileSize || existing.fileSize,
        submittedAt: now,
        isLate,
        status: 'SUBMITTED',
      },
    });
  } else {
    submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: req.user.id,
        submissionText: submissionText || null,
        filePath: fileInfo.filePath || null,
        fileName: fileInfo.fileName || null,
        fileSize: fileInfo.fileSize || null,
        submittedAt: now,
        isLate,
        status: 'SUBMITTED',
      },
    });
  }

  await logAuditEvent({
    userId: req.user.id,
    action: 'ASSIGNMENT_SUBMISSION',
    resourceType: 'SUBMISSION',
    resourceId: submission.id,
    ipAddress: req.ip,
    details: { assignmentId, isLate },
  });

  return res.status(201).json({
    success: true,
    message: isLate
      ? 'Assignment submitted successfully (Marked Late).'
      : 'Assignment submitted successfully!',
    data: submission,
  });
}

export async function gradeSubmission(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can grade submissions' });
  }

  const submissionId = parseInt(req.params.submissionId, 10);
  const parsed = GradeSubmissionSchema.parse(req.body);

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { course: true },
      },
      student: true,
    },
  });

  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  if (submission.assignment.course.facultyId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only grade submissions for your own courses' });
  }

  const finalStatus = parsed.status === 'RETURNED' ? 'RETURNED' : 'GRADED';

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      marksAwarded: parsed.marksAwarded,
      facultyFeedback: parsed.facultyFeedback || null,
      status: finalStatus,
      gradedAt: new Date(),
      gradedById: req.user.id,
    },
  });

  await logAuditEvent({
    userId: req.user.id,
    action: 'SUBMISSION_GRADED',
    resourceType: 'SUBMISSION',
    resourceId: submissionId,
    ipAddress: req.ip,
    details: { marks: parsed.marksAwarded, studentId: submission.studentId },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: submission.studentId,
      title: `Assignment Graded: ${submission.assignment.title}`,
      message: `You received ${parsed.marksAwarded}/${submission.assignment.maxMarks} marks. ${parsed.facultyFeedback ? `Feedback: "${parsed.facultyFeedback}"` : ''}`,
      type: 'ASSIGNMENT',
      link: `/assignments/${submission.assignmentId}`,
    },
  });

  emitToUser(submission.studentId, 'notification', {
    title: `Assignment Graded: ${submission.assignment.title}`,
    message: `Score: ${parsed.marksAwarded}/${submission.assignment.maxMarks}`,
  });

  return res.json({
    success: true,
    message: 'Submission graded successfully',
    data: updated,
  });
}

export async function downloadSubmissionFile(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const submissionId = parseInt(req.params.submissionId, 10);
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        include: { course: true },
      },
    },
  });

  if (!submission || !submission.filePath) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  // Access check: Student owner or course faculty
  const isOwner = submission.studentId === req.user.id;
  const isCourseFaculty = submission.assignment.course.facultyId === req.user.id;

  if (!isOwner && !isCourseFaculty && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    const fullPath = resolveFilePath(submission.filePath);
    return res.download(fullPath, submission.fileName || 'submission_file');
  } catch (error) {
    return res.status(404).json({ success: false, message: 'File not found on storage' });
  }
}

export async function getFacultySubmissions(req: Request, res: Response) {
  if (!req.user || (req.user.role !== 'FACULTY' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ success: false, message: 'Only faculty and administrators can access the grading queue' });
  }

  const { status, courseId } = req.query;

  const where: any = {};
  if (req.user.role === 'FACULTY') {
    where.assignment = {
      course: {
        facultyId: req.user.id,
      },
    };
  }

  if (status && String(status) !== 'ALL') {
    where.status = String(status);
  }

  if (courseId) {
    where.assignment = {
      ...(where.assignment || {}),
      courseId: parseInt(String(courseId), 10),
    };
  }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      student: {
        select: { id: true, fullName: true, email: true, semester: true, department: true },
      },
      assignment: {
        include: {
          course: {
            select: { id: true, courseCode: true, title: true, facultyId: true },
          },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  const formatted = submissions.map(sub => ({
    submission: {
      id: sub.id,
      assignmentId: sub.assignmentId,
      studentId: sub.studentId,
      student: sub.student,
      filePath: sub.filePath,
      fileName: sub.fileName,
      fileSize: sub.fileSize,
      submissionText: sub.submissionText,
      submittedAt: sub.submittedAt,
      isLate: sub.isLate,
      marksAwarded: sub.marksAwarded,
      facultyFeedback: sub.facultyFeedback,
      gradedAt: sub.gradedAt,
      status: sub.status,
    },
    assignment: sub.assignment,
  }));

  return res.json({
    success: true,
    data: formatted,
  });
}

