import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { contains: 'burhan' } },
        { prn: 'CM23061' },
        { fullName: { contains: 'BURHAN' } },
      ],
    },
  });
  console.log('USER IN USER TABLE:', user);

  const roster = await prisma.studentRoster.findFirst({
    where: {
      prn: 'CM23061',
    },
  });
  console.log('ROSTER ENTRY:', roster);
}

main().finally(() => prisma.$disconnect());
