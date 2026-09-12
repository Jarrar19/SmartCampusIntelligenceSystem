import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const roster = await prisma.studentRoster.count();
  console.log('User count:', users);
  console.log('Roster count:', roster);

  const shivam = await prisma.studentRoster.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'JADHAV' } },
        { fullName: { contains: 'SHIVAM' } },
      ],
    },
  });
  console.log('Shivam in roster:', shivam);

  const burhan = await prisma.studentRoster.findFirst({
    where: {
      OR: [
        { fullName: { contains: 'BURHAN' } },
        { email: { contains: 'burhan' } },
      ],
    },
  });
  console.log('Burhan in roster:', burhan);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
