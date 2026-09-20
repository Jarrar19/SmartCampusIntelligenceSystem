import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { saveBufferToFile, resolveFilePath } from '../services/fileStorage';
import { logAuditEvent } from '../services/audit';

export const VALID_CATEGORIES = [
  'ADMISSION_RENEWAL',
  'SCHOLARSHIPS',
  'ACADEMIC_RECORDS',
  'IDENTITY_DOCUMENTS',
  'CERTIFICATES',
  'OTHER_DOCUMENTS',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  ADMISSION_RENEWAL: 'Admission & Renewal',
  SCHOLARSHIPS: 'Scholarships',
  ACADEMIC_RECORDS: 'Academic Records',
  IDENTITY_DOCUMENTS: 'Identity Documents',
  CERTIFICATES: 'Certificates',
  OTHER_DOCUMENTS: 'Other Documents',
};

const ALLOWED_DOC_EXTS = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];

const UploadDocSchema = z.object({
  documentName: z.string().min(2, 'Document name must be at least 2 characters'),
  category: z.enum(VALID_CATEGORIES, {
    errorMap: () => ({ message: 'Invalid document category' }),
  }),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const UpdateDocSchema = z.object({
  documentName: z.string().min(2).optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  expiryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const VerifyDocSchema = z.object({
  verificationStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']),
  status: z.enum(['AVAILABLE', 'REQUIRED', 'EXPIRED']).optional(),
  verifierNotes: z.string().optional().nullable(),
});

const RequirementSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.enum(VALID_CATEGORIES),
  description: z.string().optional().nullable(),
  isMandatory: z.boolean().default(true),
  appliesTo: z.string().default('ALL'),
});

function isStaffAuthorized(userRole: string): boolean {
  return ['STUDENT_SECTION', 'ADMIN', 'HOD', 'FACULTY'].includes(userRole);
}

/**
 * Recalculate status based on expiryDate
 */
function computeStatus(expiryDate?: Date | null, currentStatus = 'AVAILABLE'): string {
  if (expiryDate && new Date(expiryDate).getTime() < Date.now()) {
    return 'EXPIRED';
  }
  return currentStatus === 'EXPIRED' ? 'AVAILABLE' : currentStatus;
}

// -------------------------------------------------------------
// STUDENT ACTIONS
// -------------------------------------------------------------

/**
 * Get current student's document vault
 */
export async function getMyDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const studentId = req.user.id;
    const { category, status, search } = req.query;

    const where: any = { studentId };

    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      where.documentName = { contains: search.trim() };
    }

    const documents = await prisma.studentDocument.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        verifiedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    // Auto-update expired status in-flight if applicable
    const now = Date.now();
    const updatedDocs = await Promise.all(
      documents.map(async (doc) => {
        if (doc.expiryDate && new Date(doc.expiryDate).getTime() < now && doc.status !== 'EXPIRED') {
          return prisma.studentDocument.update({
            where: { id: doc.id },
            data: { status: 'EXPIRED' },
            include: {
              verifiedBy: { select: { id: true, fullName: true, role: true } },
            },
          });
        }
        return doc;
      })
    );

    // Fetch requirements to build checklist
    const requirements = await prisma.documentRequirement.findMany({
      orderBy: { category: 'asc' },
    });

    const allStudentDocs = await prisma.studentDocument.findMany({
      where: { studentId },
    });

    // Calculate completion metrics
    const stats = {
      total: allStudentDocs.length,
      available: allStudentDocs.filter((d) => d.status === 'AVAILABLE').length,
      expired: allStudentDocs.filter((d) => d.status === 'EXPIRED').length,
      verified: allStudentDocs.filter((d) => d.verificationStatus === 'VERIFIED').length,
      pending: allStudentDocs.filter((d) => d.verificationStatus === 'PENDING').length,
      rejected: allStudentDocs.filter((d) => d.verificationStatus === 'REJECTED').length,
      requiredChecklistTotal: requirements.length,
      requiredUploadedCount: requirements.filter((reqItem) =>
        allStudentDocs.some((d) => d.category === reqItem.category && d.status !== 'EXPIRED')
      ).length,
    };

    return res.json({
      success: true,
      data: {
        documents: updatedDocs,
        stats,
        requirements,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Upload a document to student vault
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const parsed = UploadDocSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Validation failed',
      });
    }

    const { documentName, category, notes } = parsed.data;
    const expiryDate = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;

    // Securely save buffer with magic byte verification
    const saved = saveBufferToFile(
      req.file.buffer,
      'student_docs',
      req.file.originalname,
      ALLOWED_DOC_EXTS
    );

    const ext = saved.fileName.split('.').pop()?.toLowerCase() || 'bin';
    const computedStatus = computeStatus(expiryDate, 'AVAILABLE');

    const document = await prisma.studentDocument.create({
      data: {
        studentId: req.user.id,
        documentName: documentName.trim(),
        category,
        status: computedStatus,
        verificationStatus: 'PENDING',
        filePath: saved.relativePath,
        fileName: saved.fileName,
        fileSize: saved.fileSize,
        fileType: ext,
        fileHash: saved.fileHash,
        expiryDate,
        notes: notes?.trim() || null,
      },
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_DOC_UPLOADED',
      resourceType: 'STUDENT_DOCUMENT',
      resourceId: document.id,
      ipAddress: req.ip,
      details: {
        documentName: document.documentName,
        category: document.category,
        fileName: document.fileName,
        fileSize: document.fileSize,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully to your vault',
      data: document,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload document',
    });
  }
}

/**
 * Update document details (rename, category, notes, expiry)
 */
export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const doc = await prisma.studentDocument.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // IDOR Check: Only document owner or staff can update
    const isOwner = doc.studentId === req.user.id;
    const isStaff = isStaffAuthorized(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to modify this document',
      });
    }

    const parsed = UpdateDocSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Validation failed',
      });
    }

    const updateData: any = {};
    if (parsed.data.documentName !== undefined) updateData.documentName = parsed.data.documentName.trim();
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes ? parsed.data.notes.trim() : null;

    if (parsed.data.expiryDate !== undefined) {
      const exp = parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null;
      updateData.expiryDate = exp;
      updateData.status = computeStatus(exp, doc.status);
    }

    const updated = await prisma.studentDocument.update({
      where: { id },
      data: updateData,
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_DOC_UPDATED',
      resourceType: 'STUDENT_DOCUMENT',
      resourceId: updated.id,
      ipAddress: req.ip,
      details: updateData,
    });

    return res.json({
      success: true,
      message: 'Document updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a document from vault
 */
export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const doc = await prisma.studentDocument.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const isOwner = doc.studentId === req.user.id;
    const isStaff = isStaffAuthorized(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this document',
      });
    }

    // Attempt to delete physical file from disk
    try {
      const fullPath = resolveFilePath(doc.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (fsErr) {
      console.warn('[DOC_DELETE] Could not unlink file:', fsErr);
    }

    await prisma.studentDocument.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_DOC_DELETED',
      resourceType: 'STUDENT_DOCUMENT',
      resourceId: id,
      ipAddress: req.ip,
      details: { documentName: doc.documentName, studentId: doc.studentId },
    });

    return res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticated file streaming for viewing / inline preview
 */
export async function viewDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const doc = await prisma.studentDocument.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const isOwner = doc.studentId === req.user.id;
    const isStaff = isStaffAuthorized(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this document',
      });
    }

    const filePath = resolveFilePath(doc.filePath);

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_DOC_VIEWED',
      resourceType: 'STUDENT_DOCUMENT',
      resourceId: doc.id,
      ipAddress: req.ip,
      details: { studentId: doc.studentId, isStaffAccess: isStaff },
    });

    const ext = doc.fileType.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticated file download
 */
export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const doc = await prisma.studentDocument.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const isOwner = doc.studentId === req.user.id;
    const isStaff = isStaffAuthorized(req.user.role);

    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to download this document',
      });
    }

    const filePath = resolveFilePath(doc.filePath);

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_DOC_DOWNLOADED',
      resourceType: 'STUDENT_DOCUMENT',
      resourceId: doc.id,
      ipAddress: req.ip,
      details: { studentId: doc.studentId, isStaffAccess: isStaff },
    });

    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.download(filePath, doc.fileName);
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// STUDENT SECTION STAFF / ADMIN ACTIONS
// -------------------------------------------------------------

/**
 * Student Section Directory: Search and filter students with document compliance stats
 */
export async function getAdminStudentDirectory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !isStaffAuthorized(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access restricted to authorized Student Section staff and Administrators',
      });
    }

    const { search, department, semester, category, status } = req.query;

    const userWhere: any = { role: 'STUDENT' };

    if (department && typeof department === 'string' && department !== 'ALL') {
      userWhere.department = department;
    }

    if (semester && !isNaN(Number(semester))) {
      userWhere.semester = Number(semester);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      userWhere.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { prn: { contains: q } },
      ];
    }

    const students = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        fullName: true,
        email: true,
        prn: true,
        department: true,
        semester: true,
        avatarUrl: true,
        createdAt: true,
        studentDocuments: {
          select: {
            id: true,
            category: true,
            status: true,
            verificationStatus: true,
            expiryDate: true,
          },
        },
      },
      orderBy: [{ prn: 'asc' }, { fullName: 'asc' }],
    });

    const requirements = await prisma.documentRequirement.findMany();

    // Map summary metrics per student
    let directory = students.map((s) => {
      const docs = s.studentDocuments;
      const totalDocs = docs.length;
      const availableDocs = docs.filter((d) => d.status === 'AVAILABLE').length;
      const expiredDocs = docs.filter((d) => d.status === 'EXPIRED').length;
      const verifiedDocs = docs.filter((d) => d.verificationStatus === 'VERIFIED').length;
      const pendingDocs = docs.filter((d) => d.verificationStatus === 'PENDING').length;
      const rejectedDocs = docs.filter((d) => d.verificationStatus === 'REJECTED').length;

      // Check missing mandatory requirements
      const missingMandatory = requirements.filter(
        (r) => r.isMandatory && !docs.some((d) => d.category === r.category && d.status !== 'EXPIRED')
      );

      return {
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        prn: s.prn,
        department: s.department,
        semester: s.semester,
        avatarUrl: s.avatarUrl,
        metrics: {
          totalDocs,
          availableDocs,
          expiredDocs,
          verifiedDocs,
          pendingDocs,
          rejectedDocs,
          missingCount: missingMandatory.length,
          isCompliant: missingMandatory.length === 0 && expiredDocs === 0,
        },
      };
    });

    // Optional filter by status or category across student vaults
    if (status && typeof status === 'string' && status !== 'ALL') {
      if (status === 'EXPIRED') {
        directory = directory.filter((d) => d.metrics.expiredDocs > 0);
      } else if (status === 'PENDING') {
        directory = directory.filter((d) => d.metrics.pendingDocs > 0);
      } else if (status === 'ACTION_NEEDED') {
        directory = directory.filter((d) => !d.metrics.isCompliant);
      } else if (status === 'VERIFIED') {
        directory = directory.filter((d) => d.metrics.verifiedDocs > 0);
      }
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_SECTION_DIRECTORY_VIEWED',
      resourceType: 'STUDENT_DIRECTORY',
      ipAddress: req.ip,
      details: { queryCount: directory.length, search, department, status },
    });

    return res.json({
      success: true,
      data: {
        students: directory,
        total: directory.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Student Section: Inspect specific student's complete document vault
 */
export async function getAdminStudentDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !isStaffAuthorized(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        email: true,
        prn: true,
        department: true,
        semester: true,
        avatarUrl: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const documents = await prisma.studentDocument.findMany({
      where: { studentId },
      include: {
        verifiedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: [{ category: 'asc' }, { updatedAt: 'desc' }],
    });

    const requirements = await prisma.documentRequirement.findMany({
      orderBy: { category: 'asc' },
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_SECTION_STUDENT_INSPECTED',
      resourceType: 'STUDENT_DOCUMENT_VAULT',
      resourceId: studentId,
      ipAddress: req.ip,
      details: { studentPrn: student.prn, studentName: student.fullName },
    });

    return res.json({
      success: true,
      data: {
        student,
        documents,
        requirements,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Student Section: Verify or reject a student document with feedback notes
 */
export async function verifyDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !isStaffAuthorized(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid document ID' });
    }

    const doc = await prisma.studentDocument.findUnique({
      where: { id },
      include: { student: { select: { id: true, fullName: true, email: true } } },
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const parsed = VerifyDocSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Validation failed',
      });
    }

    const { verificationStatus, status, verifierNotes } = parsed.data;

    const updated = await prisma.studentDocument.update({
      where: { id },
      data: {
        verificationStatus,
        status: status || (verificationStatus === 'REJECTED' ? 'REQUIRED' : doc.status),
        verifierNotes: verifierNotes ? verifierNotes.trim() : null,
        verifiedById: req.user.id,
        verifiedAt: new Date(),
      },
      include: {
        verifiedBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    // Notify student about verification status
    try {
      const isApproved = verificationStatus === 'VERIFIED';
      await prisma.notification.create({
        data: {
          userId: doc.studentId,
          title: isApproved
            ? `✅ Document Approved: ${doc.documentName}`
            : `⚠️ Document Action Needed: ${doc.documentName}`,
          message: isApproved
            ? `Your document has been verified by the Student Section.`
            : `Student Section review: "${verifierNotes || 'Please check and re-upload standard document.'}"`,
          type: 'DOCUMENT',
          link: '/student-docx',
        },
      });
    } catch (notifErr) {
      console.warn('[DOC_NOTIF_ERROR]', notifErr);
    }

    await logAuditEvent({
      userId: req.user.id,
      action: 'STUDENT_DOC_VERIFIED',
      resourceType: 'STUDENT_DOCUMENT',
      resourceId: updated.id,
      ipAddress: req.ip,
      details: {
        verificationStatus,
        studentId: doc.studentId,
        verifierNotes,
      },
    });

    return res.json({
      success: true,
      message: `Document status successfully updated to ${verificationStatus}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// -------------------------------------------------------------
// DOCUMENT REQUIREMENTS MANAGEMENT
// -------------------------------------------------------------

export async function getRequirements(req: Request, res: Response, next: NextFunction) {
  try {
    const requirements = await prisma.documentRequirement.findMany({
      orderBy: [{ category: 'asc' }, { isMandatory: 'desc' }],
    });
    return res.json({ success: true, data: requirements });
  } catch (error) {
    next(error);
  }
}

export async function createRequirement(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !isStaffAuthorized(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const parsed = RequirementSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.errors[0]?.message || 'Validation failed',
      });
    }

    const item = await prisma.documentRequirement.create({
      data: {
        title: parsed.data.title.trim(),
        category: parsed.data.category,
        description: parsed.data.description?.trim() || null,
        isMandatory: parsed.data.isMandatory,
        appliesTo: parsed.data.appliesTo || 'ALL',
      },
    });

    await logAuditEvent({
      userId: req.user.id,
      action: 'REQUIREMENT_CREATED',
      resourceType: 'DOCUMENT_REQUIREMENT',
      resourceId: item.id,
      ipAddress: req.ip,
      details: { title: item.title, category: item.category },
    });

    return res.status(201).json({
      success: true,
      message: 'Document requirement created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRequirement(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !isStaffAuthorized(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid requirement ID' });
    }

    await prisma.documentRequirement.delete({ where: { id } });

    await logAuditEvent({
      userId: req.user.id,
      action: 'REQUIREMENT_DELETED',
      resourceType: 'DOCUMENT_REQUIREMENT',
      resourceId: id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Document requirement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Student Section / Staff: Get all uploaded student documents across the college
 * Supports category, status, verificationStatus, and search filters.
 * Returns documents with student info, prioritizing PENDING review documents first.
 */
export async function getAllAdminDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !isStaffAuthorized(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { category, status, verificationStatus, search } = req.query;

    const where: any = {};

    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = category;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (verificationStatus && typeof verificationStatus === 'string' && verificationStatus !== 'ALL') {
      where.verificationStatus = verificationStatus;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { documentName: { contains: q } },
        { fileName: { contains: q } },
        { student: { fullName: { contains: q } } },
        { student: { prn: { contains: q } } },
        { student: { email: { contains: q } } },
      ];
    }

    const documents = await prisma.studentDocument.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            prn: true,
            department: true,
            semester: true,
            avatarUrl: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Prioritize PENDING documents at the top of the queue
    documents.sort((a, b) => {
      if (a.verificationStatus === 'PENDING' && b.verificationStatus !== 'PENDING') return -1;
      if (a.verificationStatus !== 'PENDING' && b.verificationStatus === 'PENDING') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
}

