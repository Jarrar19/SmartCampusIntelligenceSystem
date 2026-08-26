import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Security & IDOR Defenses Test Suite', () => {
  let student1Token: string;
  let student2Token: string;
  let facultyToken: string;
  let student2ProductId: number;
  let student1ToStudent2ConvId: number;

  beforeAll(async () => {
    // Authenticate Student 1 (Alex)
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@sbjit.edu.in', password: 'Password@123' });
    student1Token = s1Res.body.data.accessToken;

    // Authenticate Student 2 (Rohan)
    const s2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@sbjit.edu.in', password: 'Password@123' });
    student2Token = s2Res.body.data.accessToken;

    // Authenticate Faculty
    const facRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty1@sbjit.edu.in', password: 'Password@123' });
    facultyToken = facRes.body.data.accessToken;

    // Student 2 creates a test product
    const pRes = await request(app)
      .post('/api/v1/marketplace/products')
      .set('Authorization', `Bearer ${student2Token}`)
      .field('title', 'Student 2 Private Book')
      .field('description', 'Test product')
      .field('price', '200')
      .field('category', 'TEXTBOOK');
    student2ProductId = pRes.body.data.id;

    // Conversation between Student 1 and Student 2
    const cRes = await request(app)
      .post('/api/v1/chat/conversations')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ productId: student2ProductId, initialMessage: 'Private message between S1 and S2' });
    student1ToStudent2ConvId = cRes.body.data.id;
  });

  it('IDOR Defense: Student 1 CANNOT edit Student 2 listing', async () => {
    const res = await request(app)
      .patch(`/api/v1/marketplace/products/${student2ProductId}`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ title: 'Hacked Title By S1' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('IDOR Defense: Student 1 CANNOT delete Student 2 listing', async () => {
    const res = await request(app)
      .delete(`/api/v1/marketplace/products/${student2ProductId}`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Role Guard: Student CANNOT approve or reject academic resources', async () => {
    const res = await request(app)
      .patch('/api/v1/resources/1/moderate')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Role Guard: Student CANNOT grade assignments', async () => {
    const res = await request(app)
      .patch('/api/v1/assignments/submissions/1/grade')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ marksAwarded: 100, facultyFeedback: 'Self given full marks' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('IDOR Defense: Faculty (or uninvited third party) CANNOT access private marketplace conversation between two students', async () => {
    const res = await request(app)
      .get(`/api/v1/chat/conversations/${student1ToStudent2ConvId}`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('IDOR Defense: Unauthorized third party CANNOT send messages into private chat', async () => {
    const res = await request(app)
      .post(`/api/v1/chat/conversations/${student1ToStudent2ConvId}/messages`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ content: 'Spam intrusion' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('File Storage Guard: Direct unauthenticated static HTTP access to /storage/assignments/ is denied (404/403)', async () => {
    const res = await request(app).get('/storage/assignments/secret_submission.pdf');
    expect(res.status).toBe(404);
  });

  it('File Storage Guard: Direct unauthenticated static HTTP access to /storage/resources/ is denied (404/403)', async () => {
    const res = await request(app).get('/storage/resources/exam_paper.pdf');
    expect(res.status).toBe(404);
  });

  it('IDOR Defense: Student 1 CANNOT download Student 2 submission file', async () => {
    const res = await request(app)
      .get('/api/v1/assignments/submissions/99999/download')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(404);
  });
});

