import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import routes from '../src/routes';
import { prisma } from '../src/services/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

describe('Smart AI Academic Performance Advisor & Tutor Tests', () => {
  let studentToken: string;
  let testStudentId: number;
  let testCourseId: number;

  beforeAll(async () => {
    // 1. Create test student
    const student = await prisma.user.upsert({
      where: { email: 'ai_student_test@sbjit.edu.in' },
      update: {
        isActive: true,
        isVerified: true,
      },
      create: {
        email: 'ai_student_test@sbjit.edu.in',
        fullName: 'AI Test Student',
        passwordHash: 'hashed',
        role: 'STUDENT',
        department: 'Artificial Intelligence & Machine Learning',
        semester: 6,
        sem1Cgpa: 8.2,
        sem2Cgpa: 8.5,
        isActive: true,
        isVerified: true,
      },
    });
    testStudentId = student.id;

    // 2. Create test course
    const faculty = await prisma.user.findFirst({ where: { role: 'FACULTY' } });
    const course = await prisma.course.create({
      data: {
        courseCode: 'AI601',
        title: 'Deep Learning & Neural Networks',
        department: 'Artificial Intelligence & Machine Learning',
        semester: 6,
        academicYear: '2026-27',
        facultyId: faculty?.id || 1,
      },
    });
    testCourseId = course.id;

    // 3. Create exam record
    await prisma.examRecord.create({
      data: {
        studentId: testStudentId,
        courseId: testCourseId,
        examType: 'MSE1',
        marksObtained: 52,
        maxMarks: 100,
      },
    });

    studentToken = jwt.sign(
      { userId: student.id, email: student.email, role: student.role, tokenVersion: 1 },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await prisma.examRecord.deleteMany({ where: { studentId: testStudentId } });
    await prisma.course.deleteMany({ where: { id: testCourseId } });
    await prisma.user.deleteMany({ where: { id: testStudentId } });
  });

  it('GET /api/v1/ai/performance-analysis - returns diagnostic weakness analysis', async () => {
    const res = await request(app)
      .get('/api/v1/ai/performance-analysis')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.studentName).toBeTruthy();
    expect(Array.isArray(res.body.data.coursePerformance)).toBe(true);
    expect(res.body.data.aiInsights).toBeDefined();
  });

  it('POST /api/v1/ai/tutor-chat - answers academic queries', async () => {
    const res = await request(app)
      .post('/api/v1/ai/tutor-chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Explain Binary Search Tree traversals for my DSA exam' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toContain('Data Structures');
  });

  it('POST /api/v1/ai/generate-study-plan - returns daily structured revision roadmap', async () => {
    const res = await request(app)
      .post('/api/v1/ai/generate-study-plan')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ timeframe: '7_DAYS' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plan.length).toBe(7);
  });
});
