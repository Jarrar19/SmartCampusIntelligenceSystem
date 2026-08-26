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
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['STUDENT', 'FACULTY']).optional().default('STUDENT'),
  department: z.string().optional(),
  semester: z.number().int().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this college email address already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parsed.password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // In dev mode, can auto-verify if configured
    const isVerified = config.AUTO_VERIFY_EMAILS_IN_DEV;

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName: parsed.fullName,
        passwordHash,
        role: parsed.role,
        department: parsed.department,
        semester: parsed.semester,
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
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      userId: newUser.id,
      action: 'AUTH_REGISTER',
      resourceType: 'USER',
      resourceId: newUser.id,
      ipAddress: req.ip,
      details: { email: newUser.email, role: newUser.role },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, type: 'refresh' },
      config.JWT_SECRET,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN as any }
    );

    return res.status(201).json({
      success: true,
      message: isVerified
        ? 'Registration successful! You are now logged in.'
        : `Registration successful! Verification token: ${verificationToken}`,
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
    const email = parsed.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await logAuditEvent({
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'USER',
        ipAddress: req.ip,
        details: { email, reason: 'USER_NOT_FOUND' },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
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
        details: { email, reason: 'INVALID_PASSWORD' },
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
      { userId: user.id, email: user.email, role: user.role },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, type: 'refresh' },
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
      data: { passwordHash },
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
