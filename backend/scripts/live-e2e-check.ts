const BASE_URL = 'http://localhost:5000/api/v1';

async function req(path: string, options: any = {}): Promise<{ status: number; ok: boolean; data: any }> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data: any = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runLiveVerification() {
  console.log('======================================================================');
  console.log('🧪 SMART CAMPUS INTELLIGENCE SYSTEM - LIVE MULTI-USER E2E TEST RUNNER');
  console.log('======================================================================\n');

  const randomSuffix = Math.floor(Math.random() * 100000);

  // -------------------------------------------------------------------------
  // STEP 1: Public Configuration Endpoint
  // -------------------------------------------------------------------------
  console.log('➡️  [STEP 1] Verifying Public Campus Configuration...');
  const configRes = await req('/config');
  assert(configRes.ok && configRes.data?.success, 'Failed to fetch public config');
  console.log(`    ✅ Campus: ${configRes.data.data.collegeName} (Short: ${configRes.data.data.collegeShortName})`);
  console.log(`    ✅ Authorized Email Domain: @${configRes.data.data.collegeEmailDomain}`);

  // -------------------------------------------------------------------------
  // STEP 2: Email Domain Security Enforcement
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 2] Testing Institutional Domain Security Guard...');
  const rejectRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `intruder_${randomSuffix}@gmail.com`,
      password: 'Password@123',
      fullName: 'Non-Institutional User',
      role: 'STUDENT',
    }),
  });
  assert(rejectRes.status === 400 && rejectRes.data?.success === false, 'Did not reject non-institutional domain');
  console.log(`    ✅ Correctly rejected @gmail.com: "${rejectRes.data?.message}"`);

  // -------------------------------------------------------------------------
  // STEP 3: Self-Registration: Faculty and Student Roles
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 3] Testing Public Registration for Faculty & Student...');
  
  // Register Faculty
  const newFacultyEmail = `prof_e2e_${randomSuffix}@sbjit.edu.in`;
  const facultyReg = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: newFacultyEmail,
      fullName: 'Prof. E2E Verification',
      password: 'Password@123',
      department: 'Computer Science & Engineering',
      role: 'FACULTY',
    }),
  });
  assert(facultyReg.status === 201 && facultyReg.data.data.user.role === 'FACULTY', 'Faculty registration failed to set FACULTY role');
  console.log(`    ✅ Faculty Registered: ${facultyReg.data.data.user.fullName} with role: ${facultyReg.data.data.user.role}`);

  // Register Student
  const newStudentEmail = `student_e2e_${randomSuffix}@sbjit.edu.in`;
  const studentReg = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: newStudentEmail,
      fullName: 'Student E2E Verification',
      password: 'Password@123',
      department: 'Computer Science & Engineering',
      semester: 6,
      role: 'STUDENT',
    }),
  });
  assert(studentReg.status === 201 && studentReg.data.data.user.role === 'STUDENT', 'Student registration failed to set STUDENT role');
  console.log(`    ✅ Student Registered: ${studentReg.data.data.user.fullName} with role: ${studentReg.data.data.user.role}`);

  // Privilege Guard: Attempting ADMIN registration must be disallowed
  const adminHackerReg = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `hacker_admin_${randomSuffix}@sbjit.edu.in`,
      fullName: 'Fake Admin Attempt',
      password: 'Password@123',
      role: 'ADMIN',
    }),
  });
  assert(adminHackerReg.status === 400 || (adminHackerReg.data?.data?.user?.role !== 'ADMIN'), 'Privilege guard failed: ADMIN registration allowed');
  console.log(`    ✅ Privilege Escalation Guard Verified: Unauthorized ADMIN registration rejected.`);

  // -------------------------------------------------------------------------
  // STEP 4: Authenticating Seeded Users
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 4] Logging in Seeded Profiles (Faculty, Student, Admin)...');
  
  const facLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'faculty1@sbjit.edu.in', password: 'Password@123' }),
  });
  assert(facLogin.ok && facLogin.data.data.user.role === 'FACULTY', 'Faculty login failed');
  const facultyToken = facLogin.data.data.accessToken;
  console.log(`    ✅ Faculty Logged In: ${facLogin.data.data.user.fullName} (${facLogin.data.data.user.email})`);

  const stuLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student1@sbjit.edu.in', password: 'Password@123' }),
  });
  assert(stuLogin.ok && stuLogin.data.data.user.role === 'STUDENT', 'Student login failed');
  const studentToken = stuLogin.data.data.accessToken;
  console.log(`    ✅ Student Logged In: ${stuLogin.data.data.user.fullName} (${stuLogin.data.data.user.email})`);

  const admLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@sbjit.edu.in', password: 'Password@123' }),
  });
  assert(admLogin.ok && admLogin.data.data.user.role === 'ADMIN', 'Admin login failed');
  const adminToken = admLogin.data.data.accessToken;
  console.log(`    ✅ Admin Logged In: ${admLogin.data.data.user.fullName} (${admLogin.data.data.user.email})`);

  // -------------------------------------------------------------------------
  // STEP 5: Dashboard Metric Counters
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 5] Verifying Role-Based Dashboard Metrics & Aggregations...');
  
  const facStats = await req('/users/dashboard-stats', {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(facStats.ok && facStats.data.data.role === 'FACULTY', 'Faculty stats query failed');
  console.log(`    ✅ Faculty Stats: Courses Taught=${facStats.data.data.coursesTaughtCount}, Enrolled Students=${facStats.data.data.totalStudentsEnrolled}, Pending Reviews=${facStats.data.data.pendingModerationCount}`);

  const stuStats = await req('/users/dashboard-stats', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuStats.ok && stuStats.data.data.role === 'STUDENT', 'Student stats query failed');
  console.log(`    ✅ Student Stats: Enrolled Courses=${stuStats.data.data.enrolledCoursesCount}, Pending Tasks=${stuStats.data.data.pendingAssignmentsCount}, Active Listings=${stuStats.data.data.activeListingsCount}`);

  // -------------------------------------------------------------------------
  // STEP 6: Course Management & Lifecycle
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 6] Testing Academic Course Lifecycle (Create -> Enroll -> Announce)...');
  
  const newCourseCode = `CS${Math.floor(100 + Math.random() * 899)}`;
  const createCourseRes = await req('/courses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      courseCode: newCourseCode,
      title: 'Advanced AI & Multi-Agent Robotics',
      description: 'Foundations of autonomous reasoning, multi-agent coordination, and neural perception.',
      department: 'Computer Science & Engineering',
      semester: 6,
      academicYear: '2025-2026',
    }),
  });
  assert(createCourseRes.status === 201, 'Course creation failed');
  const courseId = createCourseRes.data.data.id;
  console.log(`    ✅ Course Created: [${newCourseCode}] Advanced AI & Multi-Agent Robotics (ID: ${courseId})`);

  // Student enrolls in new course
  const enrollRes = await req(`/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(enrollRes.ok, 'Student course enrollment failed');
  console.log(`    ✅ Student Enrolled: ${enrollRes.data.message}`);

  // Faculty creates announcement
  const announceRes = await req(`/courses/${courseId}/announcements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      title: 'Welcome & Lab Setup Instructions',
      content: 'Please ensure you have configured your Python 3.12 environment and cloned the lab repository.',
    }),
  });
  assert(announceRes.status === 201, 'Announcement creation failed');
  console.log(`    ✅ Faculty Posted Announcement: "${announceRes.data.data.title}"`);

  // -------------------------------------------------------------------------
  // STEP 7: Assignments & Grading Center Workflow
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 7] Testing Assignment Creation, Submission & Grading Workflow...');
  
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createAssignRes = await req('/assignments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      courseId,
      title: 'Assignment 1: Autonomous Agent Path Planning',
      description: 'Implement A* and D* Lite algorithms on a grid environment with dynamic obstacles.',
      maxMarks: 100,
      dueDate,
      allowLate: true,
    }),
  });
  assert(createAssignRes.status === 201, 'Assignment creation failed');
  const assignmentId = createAssignRes.data.data.id;
  console.log(`    ✅ Assignment Created: [ID: ${assignmentId}] "${createAssignRes.data.data.title}"`);

  // Student submits text / git repo for assignment
  const submitRes = await req(`/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      submissionText: 'GitHub Repo: https://github.com/alexrivera/autonomous-path-planner\nAll unit tests passing with 99.4% branch coverage.',
    }),
  });
  assert(submitRes.status === 201, 'Assignment submission failed');
  const submissionId = submitRes.data.data.id;
  console.log(`    ✅ Student Submitted Solution (Submission ID: ${submissionId})`);

  // Faculty grades the submission
  const gradeRes = await req(`/assignments/submissions/${submissionId}/grade`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${facultyToken}` },
    body: JSON.stringify({
      marksAwarded: 98,
      feedback: 'Outstanding algorithmic implementation and excellent test coverage!',
    }),
  });
  assert(gradeRes.ok, 'Grading submission failed');
  console.log(`    ✅ Faculty Graded Submission: Awarded ${gradeRes.data.data.marksAwarded}/100 Marks ("${gradeRes.data.data.facultyFeedback}")`);

  // -------------------------------------------------------------------------
  // STEP 8: Resource Moderation Workflow
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 8] Testing Academic Resource Moderation & Catalog...');
  
  // Verify student cannot moderate
  const stuModCheck = await req('/resources/moderation-queue', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(stuModCheck.status === 403, 'RBAC Failure: Student should be blocked from moderation queue');
  console.log(`    ✅ RBAC Guard Verified: Student blocked from moderation queue (HTTP 403 Forbidden).`);

  // Faculty checks moderation queue
  const queueRes = await req('/resources/moderation-queue?status=PENDING_REVIEW', {
    headers: { Authorization: `Bearer ${facultyToken}` },
  });
  assert(queueRes.ok, 'Faculty failed to fetch moderation queue');
  console.log(`    ✅ Faculty Moderation Queue has ${queueRes.data.data?.length ?? 0} item(s) pending review.`);

  if (queueRes.data.data && queueRes.data.data.length > 0) {
    const item = queueRes.data.data[0];
    const approveRes = await req(`/resources/${item.id}/moderate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(approveRes.ok, 'Moderating resource failed');
    console.log(`    ✅ Faculty Approved Resource #${item.id}: "${item.title}"`);
  }

  // -------------------------------------------------------------------------
  // STEP 9: Campus Marketplace
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 9] Testing ₹0 Campus Marketplace Listings & Filters...');
  
  const createProductRes = await req('/marketplace/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      title: `Raspberry Pi 4 8GB Starter Kit + Sensor Hat (${randomSuffix})`,
      description: 'Includes power adapter, official case, 64GB micro SD card with Raspberry Pi OS.',
      category: 'ELECTRONICS',
      price: 3500,
      condition: 'LIKE_NEW',
      campusInfo: 'Hostel 3 / CS Lab Floor 2',
    }),
  });
  assert(createProductRes.status === 201, 'Marketplace listing failed');
  const productId = createProductRes.data.data.id;
  console.log(`    ✅ Marketplace Item Listed: "${createProductRes.data.data.title}" (ID: ${productId}, Price: ₹${createProductRes.data.data.price})`);

  // Query Marketplace with filter
  const browseRes = await req('/marketplace/products?category=ELECTRONICS', {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(browseRes.ok && browseRes.data.data.length > 0, 'Marketplace category search failed');
  console.log(`    ✅ Browse Marketplace (Category: ELECTRONICS): Found ${browseRes.data.data.length} listing(s).`);

  // -------------------------------------------------------------------------
  // STEP 10: Security & Audit Log Verification
  // -------------------------------------------------------------------------
  console.log('\n➡️  [STEP 10] Inspecting Immutable Audit Trail & System Security Logs...');
  
  const auditRes = await req('/users/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(auditRes.ok && auditRes.data.data.length > 0, 'Failed to retrieve audit logs');
  const recentActions = auditRes.data.data.slice(0, 5).map((l: any) => l.action).join(', ');
  console.log(`    ✅ Audit Logs Verified: ${auditRes.data.data.length} total events recorded.`);
  console.log(`    ✅ Recent Security Events: [${recentActions}]`);

  console.log('\n======================================================================');
  console.log('🎉 LIVE END-TO-END MULTI-USER VERIFICATION COMPLETE: ALL 10 STEPS PASSED');
  console.log('======================================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('\n❌ Verification Failed with Error:', err);
  process.exit(1);
});
