import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Module 4: Academic Hub & Learning Management Tests', () => {
  let facultyToken: string;
  let studentToken: string;
  let testCourseId: number;

  beforeAll(async () => {
    // Authenticate Faculty
    const facRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'faculty1@sbjit.edu.in', password: 'Password@123' });
    facultyToken = facRes.body.data.accessToken;

    // Authenticate Student
    const stuRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@sbjit.edu.in', password: 'Password@123' });
    studentToken = stuRes.body.data.accessToken;
  });

  it('Faculty should be able to create a new course', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        courseCode: 'CS505',
        title: 'Cloud Computing & Distributed Systems',
        description: 'Virtualization, microservices, container orchestration, and consensus protocols.',
        department: 'Computer Science & Engineering',
        semester: 7,
        academicYear: '2025-2026',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.courseCode).toBe('CS505');
    testCourseId = res.body.data.id;
  });

  it('Student should NOT be able to create a course (Role Guard)', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        courseCode: 'HACK101',
        title: 'Unauthorized Student Course',
        department: 'Computer Science & Engineering',
        semester: 1,
        academicYear: '2025-2026',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Student should be able to enroll in a course', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${testCourseId}/enroll`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('Faculty upload should be auto-approved (APPROVED status)', async () => {
    const fileBuffer = Buffer.from('Faculty uploaded lecture material');
    const res = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${facultyToken}`)
      .field('title', 'Distributed Systems Lecture 1')
      .field('category', 'NOTES')
      .field('courseId', testCourseId)
      .attach('file', fileBuffer, 'dist_sys_lec1.pdf');

    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe('APPROVED');
  });

  it('Student upload must enter PENDING_REVIEW status for moderation', async () => {
    const fileBuffer = Buffer.from('Student uploaded PYQ paper');
    const res = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Cloud Computing Midterm PYQ 2024')
      .field('category', 'PYQ')
      .field('courseId', testCourseId)
      .attach('file', fileBuffer, 'cloud_midterm_pyq.pdf');

    expect(res.status).toBe(201);
    expect(res.body.data.approvalStatus).toBe('PENDING_REVIEW');
    const studentResourceId = res.body.data.id;

    // Faculty should see this resource in moderation queue
    const modRes = await request(app)
      .get('/api/v1/resources/moderation-queue?status=PENDING_REVIEW')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(modRes.status).toBe(200);
    const found = modRes.body.data.some((r: any) => r.id === studentResourceId);
    expect(found).toBe(true);

    // Faculty approves the resource
    const approveRes = await request(app)
      .patch(`/api/v1/resources/${studentResourceId}/moderate`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'APPROVED' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.approvalStatus).toBe('APPROVED');
  });

  it('Faculty should be able to create assignment and student submit', async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const assignRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        courseId: testCourseId,
        title: 'Kubernetes Pod Deployment Lab',
        description: 'Deploy a replicated Node.js service on Minikube with Service & Ingress.',
        maxMarks: 100,
        dueDate: dueDate.toISOString(),
      });

    expect(assignRes.status).toBe(201);
    const assignmentId = assignRes.body.data.id;

    // Student submits
    const subRes = await request(app)
      .post(`/api/v1/assignments/${assignmentId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .field('submissionText', 'Deployed yaml manifests and verified cluster IP response.');

    expect(subRes.status).toBe(201);
    const submissionId = subRes.body.data.id;

    // Faculty grades submission
    const gradeRes = await request(app)
      .patch(`/api/v1/assignments/submissions/${submissionId}/grade`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        marksAwarded: 98,
        facultyFeedback: 'Clean YAML configuration and verified health check endpoints.',
        status: 'GRADED',
      });

    expect(gradeRes.status).toBe(200);
    expect(gradeRes.body.data.marksAwarded).toBe(98);
  });
});
