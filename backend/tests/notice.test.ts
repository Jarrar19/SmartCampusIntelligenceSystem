import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Campus Notice Board & Self-Deletion Test Suite', () => {
  let facultyToken: string;
  let studentToken: string;
  let createdNoticeId: number;

  beforeAll(async () => {
    // 1. Authenticate Faculty
    const facRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty@sbjit.edu.in', password: 'Password@123' });
    facultyToken = facRes.body.data.accessToken;

    // 2. Register fresh student
    const stuEmail = `notice_student_${Math.floor(Math.random() * 100000)}@sbjit.edu.in`;
    const stuRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: stuEmail,
        fullName: 'Notice Test Student',
        password: 'Password@123',
        role: 'STUDENT',
      });
    
    const stuLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: stuEmail, password: 'Password@123' });
    studentToken = stuLogin.body.data.accessToken;
  });

  it('Faculty SHOULD be able to publish a campus notice with auto-expiration', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Mid-Semester Exam Schedule',
        content: 'Mid-Semester exams begin next Monday in Auditorium A-102.',
        category: 'EXAM',
        priority: 'HIGH',
        location: 'Auditorium A-102',
        expiresInHours: 24,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Mid-Semester Exam Schedule');
    expect(res.body.data.category).toBe('EXAM');

    createdNoticeId = res.body.data.id;
  });

  it('Students CANNOT publish notices (returns HTTP 403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Student Notice',
        content: 'Trying to publish as student',
        category: 'GENERAL',
        priority: 'NORMAL',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('All users (including Students) SHOULD be able to view active notices', async () => {
    const res = await request(app)
      .get('/api/v1/notices')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    const found = res.body.data.find((n: any) => n.id === createdNoticeId);
    expect(found).toBeDefined();
    expect(found.author.role).toBe('FACULTY');
  });

  it('Faculty author SHOULD be able to delete their notice', async () => {
    const res = await request(app)
      .delete(`/api/v1/notices/${createdNoticeId}`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
