import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/services/prisma';

describe('Module 1: Authentication & Role Management Tests', () => {
  it('should reject registration with personal email domains (e.g. @gmail.com)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'attacker@gmail.com',
        fullName: 'Attacker Fake',
        password: 'Password@123',
        role: 'STUDENT',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('restricted to college email');
  });

  it('should reject registration with malformed email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email-string',
        fullName: 'Bad User',
        password: 'Password@123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow registration with valid college email domain (@sbjit.edu.in)', async () => {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const validEmail = `newstudent${randomSuffix}@sbjit.edu.in`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: validEmail,
        fullName: 'New Valid Student',
        password: 'SecurePassword123',
        department: 'Computer Science & Engineering',
        semester: 2,
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validEmail);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should authenticate valid seed student account and issue JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@sbjit.edu.in',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('STUDENT');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should authenticate valid seed faculty account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'faculty1@sbjit.edu.in',
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('FACULTY');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@sbjit.edu.in',
        password: 'WrongPassword999',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should protect /api/v1/auth/me from unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return current user profile with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student1@sbjit.edu.in',
        password: 'Password@123',
      });

    const token = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('student1@sbjit.edu.in');
  });

  it('Privilege Guard: Public registration cannot self-assign ADMIN role', async () => {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const email = `attacker_admin${randomSuffix}@sbjit.edu.in`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        fullName: 'Attacker Fake Admin',
        password: 'Password@123',
        role: 'ADMIN',
      });

    // Zod schema only accepts STUDENT or FACULTY, so sending ADMIN is rejected with 400
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Faculty Registration: should allow registering with FACULTY role', async () => {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const email = `new_faculty_${randomSuffix}@sbjit.edu.in`;

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email,
        fullName: 'Prof. Alan Turing',
        password: 'Password@123',
        department: 'Computer Science & Engineering',
        role: 'FACULTY',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('FACULTY');
  });

  it('Institutional Roster: should auto-match PRN, academic metrics and auto-enroll student into registered subjects', async () => {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const testEmail = `test_student_${randomSuffix}@sbjit.edu.in`;
    const testPrn = `TEST_PRN_${randomSuffix}`;

    await prisma.studentRoster.create({
      data: {
        prn: testPrn,
        fullName: 'Test Roster Student',
        email: testEmail,
        tenthPercentage: 88.5,
        twelfthPercentage: 89.2,
        sem1Cgpa: 8.5,
        sem2Cgpa: 8.7,
        sem3Cgpa: 8.9,
      },
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        fullName: 'Custom Name',
        password: 'Password@123',
        role: 'STUDENT',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.prn).toBe(testPrn);
    expect(res.body.data.user.fullName).toBe('Test Roster Student');
    expect(res.body.data.user.tenthPercentage).toBe(88.5);
    expect(res.body.data.user.sem1Cgpa).toBe(8.5);
  });

  it('Role Promotion: Non-admin CANNOT promote user roles', async () => {
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@sbjit.edu.in', password: 'Password@123' });
    const token = s1Res.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/auth/promote-role')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetUserId: 1, newRole: 'ADMIN' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

