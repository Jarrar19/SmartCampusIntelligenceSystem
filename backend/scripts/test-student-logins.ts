import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:5000/api/v1';

async function testLogin(identifier: string, password = 'Password@123') {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: identifier, password }),
    });
    const json = await res.json();
    return { ok: res.ok, status: res.status, data: json };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

async function run() {
  console.log('Testing live logins against backend server:\n');

  const testInputs = [
    { id: 'burhanuddinhussain', pass: 'Password@123' },
    { id: 'burhanuddinhusain', pass: 'Password@123' },
    { id: 'burhanuddin', pass: 'password@123' },
    { id: 'burhan', pass: 'Password@123' },
    { id: 'CM23061', pass: 'Password@123' },
    { id: 'cm23061', pass: 'CM23061' },
    { id: 'burhanuddinhusain.aiml23@sbjit.edu.in', pass: 'Password@123' },

    { id: 'shivamjadhav', pass: 'Password@123' },
    { id: 'shivam jadhav', pass: 'Password@123' },
    { id: 'shivam', pass: 'Password@123' },
    { id: 'jadhav', pass: 'Password@123' },
    { id: 'shivamaj', pass: 'Password@123' },
    { id: 'shivamaj.aiml23@sbjit.edu.in', pass: 'Password@123' },
    { id: 'CM23030', pass: 'Password@123' },
    { id: 'cm23030', pass: 'cm23030' },
    { id: 'shivamjadhav', pass: 'shivam' },
    { id: 'shivamjadhav', pass: 'jadhav' },

    { id: 'chaitanyabagde', pass: 'Password@123' },
    { id: 'sanskrutimishra', pass: 'Password@123' },
    { id: 'saraganvir', pass: 'Password@123' },
  ];

  for (const t of testInputs) {
    const res = await testLogin(t.id, t.pass);
    if (res.ok && res.data?.success) {
      const u = res.data.data.user;
      console.log(`✅ Login SUCCESS for "${t.id}" (pass: "${t.pass}") => ${u.fullName} [PRN: ${u.prn}, Role: ${u.role}]`);
    } else {
      console.log(`❌ Login FAILED for "${t.id}" (pass: "${t.pass}") => ${res.data?.message || res.error}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
