import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { config } from '../config';
import { logAuditEvent } from '../services/audit';

function validateCollegeEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return false;
  return parts[1] === config.COLLEGE_EMAIL_DOMAIN;
}

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'HOD']).optional(),
  department: z.string().optional(),
  semester: z.number().int().optional(),
  prn: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().min(1, 'Email or USN is required'),
  password: z.string().min(1),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function register(req: Request, res: Response, next: any) {
  try {
    const parsed = RegisterSchema.parse(req.body);
    const email = parsed.email.toLowerCase().trim();

    // Validate college domain strictly
    if (!validateCollegeEmail(email)) {
      return res.status(400).json({
        success: false,
        message: `Registration is restricted to college email addresses ending in '@${config.COLLEGE_EMAIL_DOMAIN}'. Personal emails are not permitted.`,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(parsed.prn ? [{ prn: parsed.prn.trim().toUpperCase() }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this college email or Roll No./USN already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // In dev mode, can auto-verify if configured
    const isVerified = config.AUTO_VERIFY_EMAILS_IN_DEV;

    // Allow STUDENT or FACULTY registration from frontend (defaults to STUDENT).
    const assignedRole = parsed.role === 'FACULTY' ? 'FACULTY' : parsed.role === 'HOD' ? 'HOD' : 'STUDENT';

    let rosterData: any = null;
    let autoEnrolledCount = 0;

    if (assignedRole === 'STUDENT') {
      rosterData = await prisma.studentRoster.findFirst({
        where: {
          OR: [
            { email },
            ...(parsed.prn ? [{ prn: parsed.prn.trim().toUpperCase() }] : []),
          ],
        },
      });
    }

    const finalFullName = rosterData?.fullName || parsed.fullName;
    const finalDepartment = rosterData?.department || parsed.department || 'Computer Science & Engineering';
    const finalSemester = assignedRole === 'STUDENT' ? (rosterData?.semester || parsed.semester || 6) : null;
    const finalPrn = (assignedRole === 'STUDENT' && parsed.prn) ? parsed.prn.trim().toUpperCase() : (rosterData?.prn || null);

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName: finalFullName,
        passwordHash,
        role: assignedRole,
        department: finalDepartment,
        semester: finalSemester,
        prn: finalPrn,
        tenthPercentage: rosterData?.tenthPercentage ?? null,
        twelfthPercentage: rosterData?.twelfthPercentage ?? null,
        sem1Cgpa: rosterData?.sem1Cgpa ?? null,
        sem2Cgpa: rosterData?.sem2Cgpa ?? null,
        sem3Cgpa: rosterData?.sem3Cgpa ?? null,
        sem4Cgpa: rosterData?.sem4Cgpa ?? null,
        sem5Cgpa: rosterData?.sem5Cgpa ?? null,
        sem6Cgpa: rosterData?.sem6Cgpa ?? null,
        backlogs: rosterData?.backlogs ?? null,
        internships: rosterData?.internships ?? null,
        tgMentorName: rosterData?.tgMentorName ?? 'Prof. Sarah Jenkins',
        isVerified,
        verificationToken: isVerified ? null : verificationToken,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        semester: true,
        prn: true,
        tenthPercentage: true,
        twelfthPercentage: true,
        sem1Cgpa: true,
        sem2Cgpa: true,
        sem3Cgpa: true,
        sem4Cgpa: true,
        sem5Cgpa: true,
        sem6Cgpa: true,
        backlogs: true,
        internships: true,
        tgMentorName: true,
        isVerified: true,
        isActive: true,
        tokenVersion: true,
        createdAt: true,
      },
    });

    // Auto-enroll student into their official registered courses if on roster
    if (rosterData && rosterData.prn) {
      await prisma.studentRoster.update({
        where: { prn: rosterData.prn },
        data: { registered: true },
      });

      const registrations = await prisma.rosterCourseRegistration.findMany({
        where: { prn: rosterData.prn },
      });

      for (const reg of registrations) {
        const matchingCourse = await prisma.course.findFirst({
          where: { courseCode: reg.courseCode },
        });
        if (matchingCourse) {
          await prisma.enrollment.upsert({
            where: {
              courseId_studentId: {
                courseId: matchingCourse.id,
                studentId: newUser.id,
              },
            },
            update: {},
            create: {
              courseId: matchingCourse.id,
              studentId: newUser.id,
            },
          });
          autoEnrolledCount++;
        }
      }
    }

    await logAuditEvent({
      userId: newUser.id,
      action: 'AUTH_REGISTER',
      resourceType: 'USER',
      resourceId: newUser.id,
      ipAddress: req.ip,
      details: {
        email: newUser.email,
        role: newUser.role,
        prn: newUser.prn,
        autoEnrolledCourses: autoEnrolledCount,
      },
    });

    // Generate tokens with tokenVersion for revocation capability
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, tokenVersion: newUser.tokenVersion },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, tokenVersion: newUser.tokenVersion, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN as any }
    );

    const welcomeMsg = rosterData
      ? `Registration successful! Welcome ${newUser.fullName} (${newUser.prn}). Auto-enrolled into ${autoEnrolledCount} registered subjects.`
      : (isVerified ? 'Registration successful! You are now logged in.' : `Registration successful! Verification token: ${verificationToken}`);

    return res.status(201).json({
      success: true,
      message: welcomeMsg,
      data: {
        user: newUser,
        accessToken,
        refreshToken,
        verificationToken: !isVerified ? verificationToken : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
}


export async function login(req: Request, res: Response, next: any) {
  try {
    const parsed = LoginSchema.parse(req.body);
    const input = parsed.email.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.toLowerCase() },
          { prn: input.toUpperCase() },
        ],
      },
    });

    if (!user) {
      await logAuditEvent({
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'USER',
        ipAddress: req.ip,
        details: { email: input, reason: 'USER_NOT_FOUND' },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email/USN or password',
      });
    }

    const isValidPassword = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!isValidPassword) {
      await logAuditEvent({
        userId: user.id,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: req.ip,
        details: { email: input, reason: 'INVALID_PASSWORD' },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the campus administrator.',
      });
    }

    await logAuditEvent({
      userId: user.id,
      action: 'AUTH_LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN as any }
    );

    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      semester: user.semester,
      avatarUrl: user.avatarUrl,
      prn: user.prn,
      tenthPercentage: user.tenthPercentage,
      twelfthPercentage: user.twelfthPercentage,
      sem1Cgpa: user.sem1Cgpa,
      sem2Cgpa: user.sem2Cgpa,
      sem3Cgpa: user.sem3Cgpa,
      sem4Cgpa: user.sem4Cgpa,
      sem5Cgpa: user.sem5Cgpa,
      sem6Cgpa: user.sem6Cgpa,
      backlogs: user.backlogs,
      internships: user.internships,
      tgMentorName: user.tgMentorName || 'Prof. Sarah Jenkins',
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req: Request, res: Response, next: any) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'AUTH_VERIFY_EMAIL',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'College email successfully verified! You can now access all services.',
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: any) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // For security, respond with generic success message so attacker cannot enumerate emails
      return res.json({
        success: true,
        message: 'If the email is registered, a password reset link/token has been generated.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'AUTH_FORGOT_PASSWORD_REQUEST',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'If the email is registered, a password reset link/token has been generated.',
      data: {
        resetToken: config.DEV_MODE ? resetToken : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: any) {
  try {
    const parsed = ResetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: parsed.token,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'AUTH_PASSWORD_RESET_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Password successfully reset. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: Request, res: Response, next: any) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const parsed = ChangePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(parsed.currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'AUTH_PASSWORD_CHANGED',
      resourceType: 'USER',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      semester: true,
      avatarUrl: true,
      prn: true,
      tenthPercentage: true,
      twelfthPercentage: true,
      sem1Cgpa: true,
      sem2Cgpa: true,
      sem3Cgpa: true,
      sem4Cgpa: true,
      sem5Cgpa: true,
      sem6Cgpa: true,
      backlogs: true,
      internships: true,
      tgMentorName: true,
      isActive: true,
      isVerified: true,
      createdAt: true,
    },
  });

  return res.json({
    success: true,
    data: user,
  });
}

export async function logout(req: Request, res: Response, next: any) {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { tokenVersion: { increment: 1 } },
      });

      await logAuditEvent({
        userId: req.user.id,
        action: 'AUTH_LOGOUT',
        resourceType: 'USER',
        resourceId: req.user.id,
        ipAddress: req.ip,
      });
    }

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function promoteUserRole(req: Request, res: Response, next: any) {
  try {
    const { targetUserId, newRole } = req.body;
    const numericId = parseInt(String(targetUserId), 10);

    if (isNaN(numericId) || !['STUDENT', 'FACULTY', 'ADMIN'].includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid targetUserId or newRole specified' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: numericId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user account not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: numericId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        semester: true,
      },
    });

    if (req.user) {
      await logAuditEvent({
        userId: req.user.id,
        action: 'AUTH_ROLE_PROMOTED',
        resourceType: 'USER',
        resourceId: updatedUser.id,
        ipAddress: req.ip,
        details: { targetUserId: updatedUser.id, previousRole: targetUser.role, newRole: updatedUser.role },
      });
    }

    return res.json({
      success: true,
      message: `User role successfully updated to ${newRole}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}


