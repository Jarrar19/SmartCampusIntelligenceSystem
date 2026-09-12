import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- ALL USERS ---');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      prn: true,
      isActive: true,
      isVerified: true,
    },
  });
  console.log(users);

  console.log('\n--- SEARCHING ROSTER FOR BURHAN ---');
  const roster = await prisma.studentRoster.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Burhan' } },
        { fullName: { contains: 'burhan' } },
        { email: { contains: 'burhan' } },
        { prn: { contains: 'burhan' } },
      ],
    },
  });
  console.log(roster);

  console.log('\n--- ALL ROSTER ENTRIES (FIRST 20) ---');
  const allRoster = await prisma.studentRoster.findMany({
    take: 20,
    select: { id: true, prn: true, fullName: true, email: true, registered: true },
  });
  console.log(allRoster);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
