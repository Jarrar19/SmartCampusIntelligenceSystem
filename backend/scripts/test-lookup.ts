import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function findUser(input: string) {
  const clean = input.trim();
  const cleanLower = clean.toLowerCase();
  const cleanUpper = clean.toUpperCase();

  // 1. Direct match on email or PRN
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanLower },
        { email: cleanLower.replace('.aim23@', '.aiml23@') },
        { email: cleanLower.replace('.aiml23@', '.aim23@') },
        { prn: cleanUpper },
      ],
    },
  });

  // 2. Try prefix or partial matching on email / username
  if (!user) {
    const username = cleanLower.split('@')[0];
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { startsWith: username } },
          { email: `${username}.aiml23@sbjit.edu.in` },
          { email: `${username}@sbjit.edu.in` },
        ],
      },
    });
  }

  // 3. Search by name match in User table
  if (!user) {
    const tokens = cleanLower.split(/[\s._-]+/).filter(t => t.length >= 3);
    for (const token of tokens) {
      user = await prisma.user.findFirst({
        where: {
          fullName: { contains: token },
        },
      });
      if (user) break;
    }
  }

  // 4. Search in StudentRoster table
  if (!user) {
    const rosterEntry = await prisma.studentRoster.findFirst({
      where: {
        OR: [
          { email: cleanLower },
          { prn: cleanUpper },
          { fullName: { contains: clean } },
          { email: { contains: cleanLower.split('@')[0] } },
        ],
      },
    });

    if (rosterEntry) {
      // Find linked user by roster email or PRN
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: rosterEntry.email },
            { prn: rosterEntry.prn },
          ],
        },
      });
    }
  }

  return user;
}

async function test() {
  const inputs = [
    'burhanuddin',
    'burhan',
    'burhanuddin@sbjit.edu.in',
    'burhanuddinhusain.aiml23@sbjit.edu.in',
    'burhanuddin.aiml23@sbjit.edu.in',
    'burhanuddinhusain@sbjit.edu.in',
    'CM23061',
    'cm23061',
    'BURHANUDDIN ZOEB HUSAIN',
  ];

  for (const inp of inputs) {
    const found = await findUser(inp);
    console.log(`Input "${inp}" => Found:`, found ? `${found.fullName} (${found.email}, PRN: ${found.prn})` : 'NOT FOUND');
  }
}

test().finally(() => prisma.$disconnect());
