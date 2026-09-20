import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Student DOCX Module & Student Section Admin Test Suite', () => {
  let student1Token: string;
  let student2Token: string;
  let studentSectionToken: string;
  let uploadedDocId: number;
  let createdReqId: number;

  beforeAll(async () => {
    // Student 1 (Raj - CM23001)
    const s1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student@sbjit.edu.in', password: 'Password@123' });
    expect(s1Res.status).toBe(200);
    student1Token = s1Res.body.data.accessToken;

    // Student 2 (Chaitanya - CM23002)
    const s2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student2@sbjit.edu.in', password: 'Password@123' });
    expect(s2Res.status).toBe(200);
    student2Token = s2Res.body.data.accessToken;

    // Student Section Officer
    const staffRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'studentsection@sbjit.edu.in', password: 'Password@123' });
    expect(staffRes.status).toBe(200);
    studentSectionToken = staffRes.body.data.accessToken;
  });

  it('Student should be able to fetch their document vault with stats and requirements', async () => {
    const res = await request(app)
      .get('/api/v1/student-docs')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.documents)).toBe(true);
    expect(res.body.data.stats.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.requirements)).toBe(true);
  });

  it('Student should be able to upload a valid document to vault', async () => {
    // Minimal valid 1-page PDF buffer
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000118 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n200\n%%EOF'
    );

    const res = await request(app)
      .post('/api/v1/student-docs/upload')
      .set('Authorization', `Bearer ${student1Token}`)
      .field('documentName', 'Bonafide Certificate Request 2026')
      .field('category', 'OTHER_DOCUMENTS')
      .field('notes', 'Required for passport renewal appointment.')
      .attach('file', validPdfBuffer, 'bonafide_cert_2026.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documentName).toBe('Bonafide Certificate Request 2026');
    expect(res.body.data.status).toBe('AVAILABLE');
    expect(res.body.data.verificationStatus).toBe('PENDING');

    uploadedDocId = res.body.data.id;
  });

  it('IDOR Defense: Another student CANNOT view or download another student document', async () => {
    // Student 2 tries to access Student 1's uploaded document
    const viewRes = await request(app)
      .get(`/api/v1/student-docs/${uploadedDocId}/view`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(viewRes.status).toBe(403);
    expect(viewRes.body.success).toBe(false);

    const downloadRes = await request(app)
      .get(`/api/v1/student-docs/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(downloadRes.status).toBe(403);
    expect(downloadRes.body.success).toBe(false);
  });

  it('Owner student CAN stream-view and download their own document', async () => {
    const viewRes = await request(app)
      .get(`/api/v1/student-docs/${uploadedDocId}/view`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.headers['content-type']).toContain('application/pdf');

    const downloadRes = await request(app)
      .get(`/api/v1/student-docs/${uploadedDocId}/download`)
      .set('Authorization', `Bearer ${student1Token}`);

    expect(downloadRes.status).toBe(200);
  });

  it('Student Section Staff CAN search and inspect any student directory', async () => {
    const res = await request(app)
      .get('/api/v1/student-docs/admin/students?search=CM23001')
      .set('Authorization', `Bearer ${studentSectionToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.students.length).toBeGreaterThan(0);
    expect(res.body.data.students[0].prn).toBe('CM23001');
    expect(res.body.data.students[0].metrics).toBeDefined();
  });

  it('Student Section Staff CAN view and verify student documents', async () => {
    // View as staff
    const viewRes = await request(app)
      .get(`/api/v1/student-docs/${uploadedDocId}/view`)
      .set('Authorization', `Bearer ${studentSectionToken}`);
    expect(viewRes.status).toBe(200);

    // Verify document
    const verifyRes = await request(app)
      .patch(`/api/v1/student-docs/admin/${uploadedDocId}/verify`)
      .set('Authorization', `Bearer ${studentSectionToken}`)
      .send({
        verificationStatus: 'VERIFIED',
        verifierNotes: 'Verified and approved by Central Student Section.',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.verificationStatus).toBe('VERIFIED');
  });

  it('Student Section Staff CAN manage institutional requirements', async () => {
    const createRes = await request(app)
      .post('/api/v1/student-docs/admin/requirements')
      .set('Authorization', `Bearer ${studentSectionToken}`)
      .send({
        title: 'College ID Card Acknowledgement',
        category: 'IDENTITY_DOCUMENTS',
        description: 'Signed acknowledgement of student RFID smartcard receipt.',
        isMandatory: false,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    createdReqId = createRes.body.data.id;

    // Delete requirement
    const delRes = await request(app)
      .delete(`/api/v1/student-docs/admin/requirements/${createdReqId}`)
      .set('Authorization', `Bearer ${studentSectionToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('Students CANNOT access Student Section Admin endpoints (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/v1/student-docs/admin/students')
      .set('Authorization', `Bearer ${student1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
