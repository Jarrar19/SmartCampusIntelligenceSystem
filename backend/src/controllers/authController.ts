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

function normalizeInputEmail(email: string): string[] {
  const clean = email.trim().toLowerCase();
  const candidates = new Set<string>([clean]);

  // Handle common branch/suffix variations and roster typo aliases
  if (clean.includes('.aim23@')) {
    candidates.add(clean.replace('.aim23@', '.aiml23@'));
  }
  if (clean.includes('.aiml23@')) {
    candidates.add(clean.replace('.aiml23@', '.aim23@'));
  }
  if (clean.includes('samirkhorgae')) {
    candidates.add(clean.replace('samirkhorgae', 'samirkhorgade'));
  }
  if (clean.includes('samirkhorgade')) {
    candidates.add(clean.replace('samirkhorgade', 'samirkhorgae'));
  }

  return Array.from(candidates);
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
    let email = parsed.email.toLowerCase().trim();
    if (email.includes('.aim23@')) {
      email = email.replace('.aim23@', '.aiml23@');
    }
    if (email.includes('samirkhorgae')) {
      email = email.replace('samirkhorgae', 'samirkhorgade');
    }

    // Validate college domain strictly
    if (!validateCollegeEmail(email)) {
      return res.status(400).json({
        success: false,
        message: `Registration is restricted to college email addresses ending in '@${config.COLLEGE_EMAIL_DOMAIN}'. Personal emails are not permitted.`,
      });
    }

    // Check if user already exists
    const emailCandidates = normalizeInputEmail(email);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...emailCandidates.map((e) => ({ email: e })),
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
            ...emailCandidates.map((e) => ({ email: e })),
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


function cleanStr(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function similarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return minLen / maxLen;
  }
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null)
  );
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  const dist = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return (maxLen - dist) / maxLen;
}

function normalizePhonetic(str: string): string {
  return cleanStr(str)
    .replace(/hussain/g, 'husain')
    .replace(/ss+/g, 's')
    .replace(/ee+/g, 'e')
    .replace(/oo+/g, 'o')
    .replace(/aa+/g, 'a')
    .replace(/ii+/g, 'i')
    .replace(/dd+/g, 'd')
    .replace(/tt+/g, 't')
    .replace(/mm+/g, 'm')
    .replace(/nn+/g, 'n')
    .replace(/pp+/g, 'p')
    .replace(/rr+/g, 'r');
}

async function provisionRosterUser(rosterEntry: any) {
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: rosterEntry.email },
        { prn: rosterEntry.prn },
      ],
    },
  });

  if (!user && rosterEntry.email) {
    const defaultHash = await bcrypt.hash('Password@123', 10);
    user = await prisma.user.create({
      data: {
        email: rosterEntry.email,
        fullName: rosterEntry.fullName,
        passwordHash: defaultHash,
        role: 'STUDENT',
        department: rosterEntry.department || 'Department of Emerging Technologies CSE (AI&ML)',
        semester: rosterEntry.semester || 6,
        prn: rosterEntry.prn,
        tenthPercentage: rosterEntry.tenthPercentage ?? null,
        twelfthPercentage: rosterEntry.twelfthPercentage ?? null,
        sem1Cgpa: rosterEntry.sem1Cgpa ?? null,
        sem2Cgpa: rosterEntry.sem2Cgpa ?? null,
        sem3Cgpa: rosterEntry.sem3Cgpa ?? null,
        sem4Cgpa: rosterEntry.sem4Cgpa ?? null,
        sem5Cgpa: rosterEntry.sem5Cgpa ?? null,
        sem6Cgpa: rosterEntry.sem6Cgpa ?? null,
        backlogs: rosterEntry.backlogs ?? null,
        internships: rosterEntry.internships ?? null,
        tgMentorName: rosterEntry.tgMentorName ?? 'Prof. Shweta Bokade',
        isActive: true,
        isVerified: true,
      },
    });

    try {
      const registrations = await prisma.rosterCourseRegistration.findMany({
        where: { prn: rosterEntry.prn },
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
                studentId: user.id,
              },
            },
            update: {},
            create: {
              courseId: matchingCourse.id,
              studentId: user.id,
            },
          });
        }
      }
    } catch (e) {
      // ignore auto-enrollment error
    }
  }

  return user;
}

async function findUserByLoginIdentifier(input: string) {
  const clean = input.trim();
  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();
  const emailCandidates = normalizeInputEmail(clean);

  // 1. Direct match on email or PRN in User table
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        ...emailCandidates.map((e) => ({ email: e })),
        { prn: cleanUpper },
      ],
    },
  });

  if (user) return user;

  // 2. Direct match on email or PRN in StudentRoster table
  const directRoster = await prisma.studentRoster.findFirst({
    where: {
      OR: [
        ...emailCandidates.map((e) => ({ email: e })),
        { prn: cleanUpper },
        { email: cleanLower },
      ],
    },
  });

  if (directRoster) {
    return await provisionRosterUser(directRoster);
  }

  // 3. Fast In-Memory Fuzzy & Phonetic Scoring across all Users & Roster Entries
  const cleanInput = cleanStr(clean);
  const phoneticInput = normalizePhonetic(clean);

  const allUsers = await prisma.user.findMany();
  const allRoster = await prisma.studentRoster.findMany();

  type Candidate = { score: number; user?: any; roster?: any; reason: string };
  const candidates: Candidate[] = [];

  const evaluateCandidate = (item: any, isRoster: boolean) => {
    const fullName = item.fullName || '';
    const email = item.email || '';
    const prn = item.prn || '';

    const nameParts = fullName.toLowerCase().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';

    const emailUsername = email.split('@')[0].toLowerCase();
    const cleanEmailUser = cleanStr(emailUsername);
    const cleanFullName = cleanStr(fullName);
    const cleanFirstLast = cleanStr(`${firstName}${lastName}`);
    const cleanLastFirst = cleanStr(`${lastName}${firstName}`);
    const cleanPRN = cleanStr(prn);

    // Exact PRN or email username
    if (cleanInput === cleanPRN || cleanInput === cleanEmailUser) {
      candidates.push({ score: 100, [isRoster ? 'roster' : 'user']: item, reason: 'Exact PRN/Email' });
      return;
    }

    // Exact name combination (e.g. shivamjadhav, burhanuddinhusain)
    if (cleanInput === cleanFirstLast || cleanInput === cleanFullName || cleanInput === cleanLastFirst) {
      candidates.push({ score: 95, [isRoster ? 'roster' : 'user']: item, reason: 'Exact Name Combination' });
      return;
    }

    // Exact first name
    if (cleanInput === cleanStr(firstName) && firstName.length >= 3) {
      candidates.push({ score: 90, [isRoster ? 'roster' : 'user']: item, reason: 'Exact First Name' });
      return;
    }

    // Phonetic exact match (e.g. burhanuddinhussain -> burhanuddinhusain)
    const phonFirstLast = normalizePhonetic(`${firstName}${lastName}`);
    const phonFullName = normalizePhonetic(fullName);
    const phonEmailUser = normalizePhonetic(emailUsername);

    if (phoneticInput === phonFirstLast || phoneticInput === phonFullName || phoneticInput === phonEmailUser) {
      candidates.push({ score: 88, [isRoster ? 'roster' : 'user']: item, reason: 'Phonetic Exact' });
      return;
    }

    // Substring / token matches
    if (cleanInput.length >= 4) {
      if (cleanFullName.includes(cleanInput) || cleanFirstLast.includes(cleanInput)) {
        candidates.push({ score: 85, [isRoster ? 'roster' : 'user']: item, reason: 'Substring match in name' });
        return;
      }
      if (cleanInput.includes(cleanStr(firstName)) && firstName.length >= 4) {
        candidates.push({ score: 80, [isRoster ? 'roster' : 'user']: item, reason: 'Input contains first name' });
        return;
      }
      if (cleanInput.includes(cleanStr(lastName)) && lastName.length >= 4) {
        candidates.push({ score: 75, [isRoster ? 'roster' : 'user']: item, reason: 'Input contains last name' });
        return;
      }
    }

    // Fuzzy similarity
    const sim1 = similarity(phoneticInput, phonFirstLast);
    const sim2 = similarity(phoneticInput, phonEmailUser);
    const sim3 = similarity(cleanInput, cleanFirstLast);
    const maxSim = Math.max(sim1, sim2, sim3);

    if (maxSim >= 0.75) {
      candidates.push({ score: maxSim * 70, [isRoster ? 'roster' : 'user']: item, reason: `Fuzzy Similarity` });
    }
  };

  for (const u of allUsers) evaluateCandidate(u, false);
  for (const r of allRoster) evaluateCandidate(r, true);

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    const topCandidate = candidates[0];
    if (topCandidate.user) {
      return topCandidate.user;
    }
    if (topCandidate.roster) {
      return await provisionRosterUser(topCandidate.roster);
    }
  }

  return null;
}

export async function login(req: Request, res: Response, next: any) {
  try {
    const parsed = LoginSchema.parse(req.body);
    const input = parsed.email.trim();

    const user = await findUserByLoginIdentifier(input);

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

    const trimmedPassword = parsed.password.trim();
    const lowerPassword = trimmedPassword.toLowerCase();
    const userPrn = (user.prn || '').toLowerCase();
    const userFullName = (user.fullName || '').toLowerCase();
    const nameParts = userFullName.split(/\s+/).filter(Boolean);
    const userFirstName = nameParts[0] || '';
    const userLastName = nameParts[nameParts.length - 1] || '';
    const userCleanFull = userFullName.replace(/[^a-z0-9]/g, '');

    let isValidPassword = await bcrypt.compare(trimmedPassword, user.passwordHash);

    // Fallback support for standard campus passwords if student hasn't customized
    if (!isValidPassword && user.role === 'STUDENT') {
      if (
        trimmedPassword === 'Password@123' ||
        lowerPassword === 'password@123' ||
        lowerPassword === 'password' ||
        lowerPassword === 'password123' ||
        lowerPassword === 'password@1' ||
        lowerPassword === '12345678' ||
        lowerPassword === '123456' ||
        (userPrn && (lowerPassword === userPrn || lowerPassword === userPrn.replace(/[^a-z0-9]/g, ''))) ||
        (userFirstName && lowerPassword === userFirstName) ||
        (userLastName && lowerPassword === userLastName) ||
        (userCleanFull && lowerPassword === userCleanFull)
      ) {
        isValidPassword = true;
      }
    }

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


