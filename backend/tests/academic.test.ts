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
    const fileBuffer = Buffer.from('%PDF-1.4 Faculty uploaded lecture material');
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
    const fileBuffer = Buffer.from('%PDF-1.4 Student uploaded PYQ paper');
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

  it('Faculty should be able to update own course details', async () => {
    const res = await request(app)
      .patch(`/api/v1/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Cloud Computing & Advanced Distributed Systems (Updated)',
        semester: 8,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toContain('(Updated)');
    expect(res.body.data.semester).toBe(8);
  });

  it('Student CANNOT edit a course (Role Guard)', async () => {
    const res = await request(app)
      .patch(`/api/v1/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Hacked Course Title',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Faculty should be able to update own assignment details', async () => {
    // Create assignment to update
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const assignRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        courseId: testCourseId,
        title: 'Docker Swarm Assignment',
        description: 'Configure overlay network',
        maxMarks: 50,
        dueDate: dueDate.toISOString(),
      });

    const assignmentId = assignRes.body.data.id;

    // Update assignment
    const updateRes = await request(app)
      .patch(`/api/v1/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Docker Swarm Assignment (Updated)',
        maxMarks: 75,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.maxMarks).toBe(75);

    // Delete assignment
    const delRes = await request(app)
      .delete(`/api/v1/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('Student CANNOT moderate a resource (Role Guard)', async () => {
    const res = await request(app)
      .patch('/api/v1/resources/1/moderate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Faculty rejection must require constructive reason and update status to REJECTED', async () => {
    const fileBuffer = Buffer.from('%PDF-1.4 Low quality submission');
    const uploadRes = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${studentToken}`)
      .field('title', 'Blurry Exam Notes Upload')
      .field('category', 'NOTES')
      .field('courseId', testCourseId)
      .attach('file', fileBuffer, 'blurry_notes.pdf');

    const resourceId = uploadRes.body.data.id;

    // Rejection without reason fails
    const failRes = await request(app)
      .patch(`/api/v1/resources/${resourceId}/moderate`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'REJECTED' });

    expect(failRes.status).toBe(400);

    // Rejection with reason succeeds
    const rejectRes = await request(app)
      .patch(`/api/v1/resources/${resourceId}/moderate`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        status: 'REJECTED',
        rejectionReason: 'Scan quality is illegible. Please re-upload as a clear PDF scan.',
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.approvalStatus).toBe('REJECTED');
    expect(rejectRes.body.data.rejectionReason).toContain('Scan quality is illegible');
  });

  it('Faculty should be able to delete course and cascade associations', async () => {
    const res = await request(app)
      .delete(`/api/v1/courses/${testCourseId}`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

