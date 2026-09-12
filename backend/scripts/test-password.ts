import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'burhanuddinhusain.aiml23@sbjit.edu.in' },
  });
  if (!user) {
    console.log('User not found!');
    return;
  }
  console.log('User:', {
    id: user.id,
    email: user.email,
    prn: user.prn,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
  });

  const testPasswords = [
    'Password@123',
    'password',
    'password123',
    'Password123',
    'burhan',
    'burhanuddin',
    'CM23061',
    'cm23061',
    'sbjit123',
    'admin123',
  ];

  for (const pw of testPasswords) {
    const match = await bcrypt.compare(pw, user.passwordHash);
    console.log(`Password "${pw}": ${match ? 'MATCH!' : 'no match'}`);
  }
}

main().finally(() => prisma.$disconnect());
