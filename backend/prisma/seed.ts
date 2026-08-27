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
    update: {
      passwordHash,
      role: 'FACULTY',
      isActive: true,
      isVerified: true,
    },
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

  await prisma.user.upsert({
    where: { email: 'faculty@sbjit.edu.in' },
    update: {
      passwordHash,
      role: 'FACULTY',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'faculty@sbjit.edu.in',
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
    update: {
      passwordHash,
      role: 'STUDENT',
      prn: 'CM23003',
      fullName: 'DHANSHREE MADEHO BHORKAR',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'student1@sbjit.edu.in',
      fullName: 'DHANSHREE MADEHO BHORKAR',
      prn: 'CM23003',
      passwordHash,
      role: 'STUDENT',
      department: 'Department of Emerging Technologies CSE (AI&ML)',
      semester: 6,
      isActive: true,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
  });

  await prisma.user.upsert({
    where: { email: 'student@sbjit.edu.in' },
    update: {
      passwordHash,
      role: 'STUDENT',
      prn: 'CM23001',
      fullName: 'RAJ RAVINDRA URKUNDE',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'student@sbjit.edu.in',
      fullName: 'RAJ RAVINDRA URKUNDE',
      prn: 'CM23001',
      passwordHash,
      role: 'STUDENT',
      department: 'Department of Emerging Technologies CSE (AI&ML)',
      semester: 6,
      isActive: true,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@sbjit.edu.in' },
    update: {
      passwordHash,
      role: 'STUDENT',
      prn: 'CM23002',
      fullName: 'CHAITANYA PRANESH BAGDE',
      isActive: true,
      isVerified: true,
    },
    create: {
      email: 'student2@sbjit.edu.in',
      fullName: 'CHAITANYA PRANESH BAGDE',
      prn: 'CM23002',
      passwordHash,
      role: 'STUDENT',
      department: 'Department of Emerging Technologies CSE (AI&ML)',
      semester: 6,
      isActive: true,
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sbjit.edu.in' },
    update: {
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isVerified: true,
    },
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

  const studentAlias = await prisma.user.findUnique({ where: { email: 'student@sbjit.edu.in' } });
  if (studentAlias) {
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course1.id, studentId: studentAlias.id } },
      update: {},
      create: { courseId: course1.id, studentId: studentAlias.id },
    });
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course2.id, studentId: studentAlias.id } },
      update: {},
      create: { courseId: course2.id, studentId: studentAlias.id },
    });
  }

  console.log('✅ Enrollments seeded');

  // 3.1. Seed Institutional Student Roster & Excel Courses
  const rosterPath = path.resolve(__dirname, '../storage/roster_data.json');
  if (fs.existsSync(rosterPath)) {
    try {
      const rosterData = JSON.parse(fs.readFileSync(rosterPath, 'utf-8'));
      
      // 3.1. Upsert All Real Faculty Members
      const facultyMap: { [email: string]: any } = {};
      if (rosterData.faculties) {
        for (const f of rosterData.faculties) {
          const facultyUser = await prisma.user.upsert({
            where: { email: f.email },
            update: {
              fullName: f.fullName,
              role: 'FACULTY',
              department: f.department || 'Artificial Intelligence & Machine Learning',
              isActive: true,
              isVerified: true,
            },
            create: {
              email: f.email,
              fullName: f.fullName,
              passwordHash,
              role: 'FACULTY',
              department: f.department || 'Artificial Intelligence & Machine Learning',
              isActive: true,
              isVerified: true,
            },
          });
          facultyMap[f.email] = facultyUser;
        }
      }

      // 3.2. Upsert Student Roster
      for (const student of rosterData.students) {
        await prisma.studentRoster.upsert({
          where: { prn: student.prn },
          update: {
            fullName: student.fullName,
            email: student.email,
            tenthPercentage: student.tenthPercentage,
            twelfthPercentage: student.twelfthPercentage,
            sem1Cgpa: student.sem1Cgpa,
            sem2Cgpa: student.sem2Cgpa,
            sem3Cgpa: student.sem3Cgpa,
            sem4Cgpa: student.sem4Cgpa,
            sem5Cgpa: student.sem5Cgpa,
            sem6Cgpa: student.sem6Cgpa,
            backlogs: student.backlogs,
            internships: student.internships,
            tgMentorName: student.tgMentorName || 'Prof. Bhushan Manjrekar',
            department: 'Artificial Intelligence & Machine Learning',
            semester: 6,
          },
          create: {
            prn: student.prn,
            fullName: student.fullName,
            email: student.email,
            tenthPercentage: student.tenthPercentage,
            twelfthPercentage: student.twelfthPercentage,
            sem1Cgpa: student.sem1Cgpa,
            sem2Cgpa: student.sem2Cgpa,
            sem3Cgpa: student.sem3Cgpa,
            sem4Cgpa: student.sem4Cgpa,
            sem5Cgpa: student.sem5Cgpa,
            sem6Cgpa: student.sem6Cgpa,
            backlogs: student.backlogs,
            internships: student.internships,
            tgMentorName: student.tgMentorName || 'Prof. Bhushan Manjrekar',
            department: 'Artificial Intelligence & Machine Learning',
            semester: 6,
          },
        });
      }

      // 3.3. Upsert Excel Courses mapped to their actual Instructor
      for (const c of rosterData.courses) {
        const assignedFaculty = facultyMap[c.facultyEmail] || faculty;
        const existingCourse = await prisma.course.findFirst({
          where: { courseCode: c.courseCode },
        });
        if (!existingCourse) {
          const newCourse = await prisma.course.create({
            data: {
              courseCode: c.courseCode,
              title: c.title,
              description: `${c.title} - Official registered academic curriculum course instructed by ${c.facultyName || 'Faculty'}.`,
              department: 'Artificial Intelligence & Machine Learning',
              semester: 6,
              academicYear: '2026-2027',
              courseType: c.courseType || 'THEORY',
              credits: c.credits || 3,
              facultyId: assignedFaculty.id,
            },
          });

          // Seed default course welcome announcement from instructor
          await prisma.announcement.create({
            data: {
              courseId: newCourse.id,
              authorId: assignedFaculty.id,
              title: `Welcome to ${c.title}`,
              content: `Welcome students to ${c.title} (${c.courseCode}). Please review the syllabus and lab guidelines. My office hours are available on your student dashboard.`,
            },
          });
        } else {
          await prisma.course.update({
            where: { id: existingCourse.id },
            data: {
              courseType: c.courseType || 'THEORY',
              credits: c.credits || 3,
              facultyId: assignedFaculty.id,
            },
          });
        }
      }

      // 3.4. Upsert Course Registrations
      for (const reg of rosterData.studentCourses) {
        await prisma.rosterCourseRegistration.upsert({
          where: {
            prn_courseCode: {
              prn: reg.prn,
              courseCode: reg.courseCode,
            },
          },
          update: {
            courseName: reg.courseName,
            courseType: reg.courseType || 'THEORY',
            credits: reg.credits || 3,
          },
          create: {
            prn: reg.prn,
            courseCode: reg.courseCode,
            courseName: reg.courseName,
            courseType: reg.courseType || 'THEORY',
            credits: reg.credits || 3,
          },
        });
      }

      // 3.5. Pre-create all 62 students as active User accounts with default password 'Password@123'
      for (const student of rosterData.students) {
        const u = await prisma.user.upsert({
          where: { email: student.email },
          update: {
            fullName: student.fullName,
            passwordHash,
            role: 'STUDENT',
            department: 'Artificial Intelligence & Machine Learning',
            semester: 6,
            prn: student.prn,
            tenthPercentage: student.tenthPercentage,
            twelfthPercentage: student.twelfthPercentage,
            sem1Cgpa: student.sem1Cgpa,
            sem2Cgpa: student.sem2Cgpa,
            sem3Cgpa: student.sem3Cgpa,
            sem4Cgpa: student.sem4Cgpa,
            sem5Cgpa: student.sem5Cgpa,
            sem6Cgpa: student.sem6Cgpa,
            backlogs: student.backlogs,
            internships: student.internships,
            tgMentorName: student.tgMentorName || 'Prof. Bhushan Manjrekar',
            isActive: true,
            isVerified: true,
          },
          create: {
            email: student.email,
            fullName: student.fullName,
            passwordHash,
            role: 'STUDENT',
            department: 'Artificial Intelligence & Machine Learning',
            semester: 6,
            prn: student.prn,
            tenthPercentage: student.tenthPercentage,
            twelfthPercentage: student.twelfthPercentage,
            sem1Cgpa: student.sem1Cgpa,
            sem2Cgpa: student.sem2Cgpa,
            sem3Cgpa: student.sem3Cgpa,
            sem4Cgpa: student.sem4Cgpa,
            sem5Cgpa: student.sem5Cgpa,
            sem6Cgpa: student.sem6Cgpa,
            backlogs: student.backlogs,
            internships: student.internships,
            tgMentorName: student.tgMentorName || 'Prof. Bhushan Manjrekar',
            isActive: true,
            isVerified: true,
          },
        });

        // Auto-enroll in all courses registered in Excel for this PRN
        const myRegs = rosterData.studentCourses.filter((sc: any) => sc.prn === student.prn);
        for (const reg of myRegs) {
          const course = await prisma.course.findFirst({ where: { courseCode: reg.courseCode } });
          if (course) {
            await prisma.enrollment.upsert({
              where: {
                courseId_studentId: {
                  courseId: course.id,
                  studentId: u.id,
                },
              },
              update: {},
              create: {
                courseId: course.id,
                studentId: u.id,
              },
            });
          }
        }
      }

      console.log(`✅ Loaded & pre-activated ${Object.keys(facultyMap).length} real Faculty accounts, ${rosterData.students.length} students & ${rosterData.courses.length} courses`);
    } catch (err) {
      console.error('⚠️ Could not load roster_data.json:', err);
    }
  }

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
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
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
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
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
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80', isPrimary: true }
        ]
      }
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
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
    },
  });

  const prod5 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student2.id,
      title: 'Apple MacBook Air M1 (8GB / 256GB SSD) - Space Grey',
      description: 'Barely used MacBook Air M1 in battery health 96%. Includes original MagSafe charger and leather sleeve.',
      category: 'ELECTRONICS',
      price: 42000,
      condition: 'LIKE_NEW',
      campusInfo: 'Hostel Block C',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 184,
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
    },
  });

  const prod6 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student1.id,
      title: 'Hero Octane 21-Speed Gear Bicycle (Campus Commute)',
      description: 'Sturdy mountain bicycle with front suspension, disk brakes, and helmet included. Great for riding between hostels and academic blocks.',
      category: 'OTHER',
      price: 3500,
      condition: 'GOOD',
      campusInfo: 'Hostel Cycle Stand Block A',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 142,
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
    },
  });

  const prod7 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student2.id,
      title: 'Sony WH-1000XM4 Wireless Noise Canceling Headphones',
      description: 'Active Noise Canceling over-ear headphones with 30hr battery life. Crystal clear sound for library studying.',
      category: 'ELECTRONICS',
      price: 8500,
      condition: 'LIKE_NEW',
      campusInfo: 'Central Library / Reading Room',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 210,
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
    },
  });

  const prod8 = await prisma.marketplaceProduct.create({
    data: {
      sellerId: student1.id,
      title: 'Engineering Mini Drafter + Wooden A2 Drawing Board',
      description: 'Complete engineering graphics kit with mini drafter clamp, A2 drawing board, clips, and set squares.',
      category: 'OTHER',
      price: 450,
      condition: 'GOOD',
      campusInfo: 'Mechanical Lab Block',
      status: 'AVAILABLE',
      moderationStatus: 'APPROVED',
      viewsCount: 76,
      images: {
        create: [
          { imagePath: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80', isPrimary: true },
          { imagePath: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=800&q=80', isPrimary: false }
        ]
      }
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
