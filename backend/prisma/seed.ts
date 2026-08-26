import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Ensure storage directories
  const storageDir = path.resolve(__dirname, '../storage');
  ['resources', 'assignments', 'marketplace', 'general'].forEach(sub => {
    const p = path.join(storageDir, sub);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  // Create sample dummy files for resources
  const dummyFile1Path = path.join(storageDir, 'resources', 'dsa_notes_sample.pdf');
  fs.writeFileSync(dummyFile1Path, 'Sample PDF content: Data Structures and Algorithms Module 1-5 Lecture Notes.');

  const dummyFile2Path = path.join(storageDir, 'resources', 'cs301_pyq_2024.pdf');
  fs.writeFileSync(dummyFile2Path, 'Sample PDF content: CS301 End Semester Examination 2024 Previous Year Question Paper.');

  const dummyFile3Path = path.join(storageDir, 'resources', 'dbms_study_guide.pdf');
  fs.writeFileSync(dummyFile3Path, 'Sample PDF content: Database Management Systems Quick Revision Guide.');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Users
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty1@sbjit.edu.in' },
    update: {},
    create: {
      email: 'faculty1@sbjit.edu.in',
      fullName: 'Prof. Sarah Jenkins',
      passwordHash,
      role: 'FACULTY',
      department: 'Computer Science & Engineering',
      isActive: true,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@sbjit.edu.in' },
    update: {},
    create: {
      email: 'student1@sbjit.edu.in',
      fullName: 'Alex Rivera',
      passwordHash,
      role: 'STUDENT',
      department: 'Computer Science & Engineering',
      semester: 6,
      isActive: true,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@sbjit.edu.in' },
    update: {},
    create: {
      email: 'student2@sbjit.edu.in',
      fullName: 'Rohan Sharma',
      passwordHash,
      role: 'STUDENT',
      department: 'Electronics & Communication Engineering',
      semester: 4,
      isActive: true,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sbjit.edu.in' },
    update: {},
    create: {
      email: 'admin@sbjit.edu.in',
      fullName: 'Dean of Academics',
      passwordHash,
      role: 'ADMIN',
      department: 'Applied Sciences & Humanities',
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Users seeded');

  // 2. Create Courses
  const course1 = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      courseCode: 'CS301',
      title: 'Data Structures & Algorithms',
      description: 'Comprehensive study of fundamental data structures, graph algorithms, and asymptotic complexity.',
      department: 'Computer Science & Engineering',
      semester: 6,
      academicYear: '2025-2026',
      facultyId: faculty.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      courseCode: 'CS402',
      title: 'Database Management Systems',
      description: 'Relational algebra, SQL query optimization, indexing, transaction processing, and ACID properties.',
      department: 'Computer Science & Engineering',
      semester: 6,
      academicYear: '2025-2026',
      facultyId: faculty.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      courseCode: 'EE201',
      title: 'Digital Signal Processing',
      description: 'Discrete-time signals and systems, Z-transform, DFT, FFT algorithms, and digital filter design.',
      department: 'Electronics & Communication Engineering',
      semester: 4,
      academicYear: '2025-2026',
      facultyId: faculty.id,
    },
  });

  console.log('✅ Courses seeded');

  // 3. Enrollments
  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId: course1.id, studentId: student1.id } },
    update: {},
    create: { courseId: course1.id, studentId: student1.id },
  });

  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId: course2.id, studentId: student1.id } },
    update: {},
    create: { courseId: course2.id, studentId: student1.id },
  });

  await prisma.enrollment.upsert({
    where: { courseId_studentId: { courseId: course3.id, studentId: student2.id } },
    update: {},
    create: { courseId: course3.id, studentId: student2.id },
  });

  console.log('✅ Enrollments seeded');

  // 4. Announcements
  await prisma.announcement.createMany({
    data: [
      {
        courseId: course1.id,
        authorId: faculty.id,
        title: 'Welcome to CS301 Data Structures & Algorithms',
        content: 'Please review the syllabus and ensure you have installed the C++/Python development environment before Lab 1.',
      },
      {
        courseId: course1.id,
        authorId: faculty.id,
        title: 'Midterm Exam Schedule Released',
        content: 'The Midterm Examination will cover Trees, Heaps, and Graph Algorithms. Refer to the uploaded lecture notes.',
      },
      {
        courseId: course2.id,
        authorId: faculty.id,
        title: 'DBMS Assignment 1 Posted',
        content: 'Assignment 1 on Relational Schema Design is now open for submission. Deadline is next Friday at 11:59 PM.',
      },
    ],
  });

  // 5. Academic Resources (Approved & Pending Review)
  const res1 = await prisma.resource.create({
    data: {
      courseId: course1.id,
      title: 'Complete Tree & Graph Algorithms Lecture Notes',
      description: 'Handwritten and typed notes covering AVL Trees, Red-Black Trees, Dijkstra, and Bellman-Ford algorithms.',
      category: 'NOTES',
      filePath: 'resources/dsa_notes_sample.pdf',
      fileName: 'dsa_lecture_notes_complete.pdf',
      fileSize: 1024 * 450,
      mimeType: 'application/pdf',
      fileHash: crypto.createHash('sha256').update('sample1').digest('hex'),
      uploaderId: faculty.id,
      uploaderRole: 'FACULTY',
      approvalStatus: 'APPROVED',
      reviewerId: faculty.id,
      reviewedAt: new Date(),
      downloadsCount: 38,
      viewsCount: 142,
      subjectCode: 'CS301',
      department: 'Computer Science & Engineering',
      semester: 6,
      tags: 'trees, graphs, dsa, lecture-notes',
    },
  });

  const res2 = await prisma.resource.create({
    data: {
      courseId: course1.id,
      title: 'CS301 End Semester Question Paper (2024 Solution Key)',
      description: 'Solved previous year exam paper uploaded by Alex Rivera with detailed solution breakdowns.',
      category: 'PYQ',
      filePath: 'resources/cs301_pyq_2024.pdf',
      fileName: 'CS301_PYQ_2024_Solved.pdf',
      fileSize: 1024 * 320,
      mimeType: 'application/pdf',
      fileHash: crypto.createHash('sha256').update('sample2').digest('hex'),
      uploaderId: student1.id,
      uploaderRole: 'STUDENT',
      approvalStatus: 'APPROVED', // Already reviewed and approved
      reviewerId: faculty.id,
      reviewedAt: new Date(),
      downloadsCount: 52,
      viewsCount: 210,
      subjectCode: 'CS301',
      department: 'Computer Science & Engineering',
      semester: 6,
      tags: 'pyq, 2024, past-papers, exam-prep',
    },
  });

  // Pending Moderation Item (Uploaded by student2, awaiting faculty approval!)
  const res3 = await prisma.resource.create({
    data: {
      courseId: course2.id,
      title: 'Database Normalization (1NF to BCNF) Cheatsheet & Examples',
      description: 'Student-created visual cheatsheet on database normalization rules with step-by-step decomposition examples.',
      category: 'STUDENT_GUIDE',
      filePath: 'resources/dbms_study_guide.pdf',
      fileName: 'DBMS_Normalization_Cheatsheet.pdf',
      fileSize: 1024 * 180,
      mimeType: 'application/pdf',
      fileHash: crypto.createHash('sha256').update('sample3').digest('hex'),
      uploaderId: student2.id,
      uploaderRole: 'STUDENT',
      approvalStatus: 'PENDING_REVIEW', // In moderation queue!
      downloadsCount: 0,
      viewsCount: 5,
      subjectCode: 'CS402',
      department: 'Computer Science & Engineering',
      semester: 6,
      tags: 'dbms, normalization, bcnf, cheatsheet',
    },
  });

  // Resource Ratings & Bookmarks
  await prisma.resourceRating.create({
    data: { resourceId: res1.id, userId: student1.id, isHelpful: true },
  });
  await prisma.resourceRating.create({
    data: { resourceId: res2.id, userId: student2.id, isHelpful: true },
  });
  await prisma.resourceBookmark.create({
    data: { resourceId: res1.id, userId: student1.id },
  });

  console.log('✅ Academic Resources seeded');

  // 6. Assignments & Submissions
  const assignDueDate = new Date();
  assignDueDate.setDate(assignDueDate.getDate() + 7);

  const assignment1 = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      facultyId: faculty.id,
      title: 'Assignment 1: Red-Black Tree Implementation & Benchmark',
      description: 'Implement a self-balancing Red-Black Tree in C++ or Java with insert, delete, and search routines. Provide benchmark results against standard BST.',
      maxMarks: 100,
      dueDate: assignDueDate,
      allowLate: true,
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      courseId: course2.id,
      facultyId: faculty.id,
      title: 'Assignment 2: Complex SQL Queries & Index Tuning',
      description: 'Analyze execution plans for 5 given slow queries and create optimal B-Tree and Hash indexes to improve latency.',
      maxMarks: 50,
      dueDate: assignDueDate,
      allowLate: true,
    },
  });

  // Seed Alex's submission for Assignment 1
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1.id,
      submissionText: 'GitHub Repo: https://github.com/alexrivera/rbt-benchmark\nAttached source code archive with runtime complexity graphs.',
      submittedAt: new Date(),
      isLate: false,
      marksAwarded: 95,
      facultyFeedback: 'Excellent implementation of node coloring and rotation cases! Benchmark analysis was thorough.',
      gradedAt: new Date(),
      gradedById: faculty.id,
      status: 'GRADED',
    },
  });

  console.log('✅ Assignments and Submissions seeded');

  // 7. Marketplace Products
  const prod1 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student2.id,
      title: 'Higher Engineering Mathematics by B.S. Grewal (44th Edition)',
      description: 'Standard textbook in pristine condition. No pen marks or highlights. Essential for 1st-4th semester engineering mathematics.',
      category: 'TEXTBOOK',
      price: 320,
      condition: 'LIKE_NEW',
      campusInfo: 'Hostel Block B / Library Lawn',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 64,
    },
  });

  const prod2 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student1.id,
      title: 'Texas Instruments TI-84 Plus Programmable Calculator',
      description: 'Full working scientific calculator with batteries included. Perfect for electrical engineering, signals, and calculus coursework.',
      category: 'CALCULATOR',
      price: 1100,
      condition: 'GOOD',
      campusInfo: 'CS Department, 3rd Floor',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 92,
    },
  });

  const prod3 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student2.id,
      title: 'Pure Cotton White Lab Coat (Size M)',
      description: 'Worn only twice during chemistry lab. Freshly washed and ironed with university embroidery.',
      category: 'LAB_COAT',
      price: 180,
      condition: 'LIKE_NEW',
      campusInfo: 'Hostel Block B',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 45,
    },
  });

  const prod4 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student1.id,
      title: 'Arduino Uno R3 Starter Kit + 25 Sensor Modules',
      description: 'Complete embedded systems kit with breadboard, jumper wires, ultrasonic, temperature, and Bluetooth modules.',
      category: 'ELECTRONICS',
      price: 750,
      condition: 'GOOD',
      campusInfo: 'Innovation Center / CS Lab',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 118,
    },
  });

  // Favorites
  await prisma.marketplaceFavorite.create({
    data: { productId: prod1.id, userId: student1.id },
  });

  // Seed a sample conversation between Student 1 (Alex) and Student 2 (Rohan) for product 1
  const conv = await prisma.conversation.create({
    data: {
      productId: prod1.id,
      buyerId: student1.id,
      sellerId: student2.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv.id,
        senderId: student1.id,
        content: 'Hi Rohan! Is the Higher Engineering Mathematics textbook still available?',
        isRead: true,
      },
      {
        conversationId: conv.id,
        senderId: student2.id,
        content: 'Hey Alex, yes it is available! I can hand it over near the central library tomorrow around 2 PM.',
        isRead: false,
      },
    ],
  });

  // Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        title: 'Assignment 1 Graded (CS301)',
        message: 'You scored 95/100 on "Red-Black Tree Implementation". Check feedback.',
        type: 'ASSIGNMENT',
        link: `/assignments/${assignment1.id}`,
      },
      {
        userId: student1.id,
        title: 'New Message from Rohan',
        message: 'Regarding "Higher Engineering Mathematics by B.S. Grewal"',
        type: 'CHAT',
        link: `/marketplace/messages`,
      },
      {
        userId: faculty.id,
        title: 'New Resource Pending Review',
        message: 'Rohan Sharma uploaded "Database Normalization Cheatsheet" awaiting approval.',
        type: 'MODERATION',
        link: `/resources/moderation`,
      },
    ],
  });

  console.log('✅ Marketplace, Chat, and Notifications seeded');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
