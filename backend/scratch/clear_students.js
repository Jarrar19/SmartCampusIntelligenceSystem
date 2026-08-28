const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearStudents() {
  console.log('🧹 Clearing all student accounts from database...');

  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, email: true, fullName: true, prn: true },
  });

  const studentIds = students.map((s) => s.id);
  console.log(`Found ${students.length} student accounts to remove.`);

  if (studentIds.length > 0) {
    // Delete student dependent records first
    await prisma.enrollment.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.submission.deleteMany({ where: { studentId: { in: studentIds } } });
    await prisma.notification.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.resourceRating.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.resourceBookmark.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.marketplaceFavorite.deleteMany({ where: { userId: { in: studentIds } } });
    await prisma.purchaseRequest.deleteMany({ where: { OR: [{ buyerId: { in: studentIds } }, { sellerId: { in: studentIds } }] } });
    await prisma.message.deleteMany({ where: { senderId: { in: studentIds } } });
    await prisma.conversation.deleteMany({ where: { OR: [{ buyerId: { in: studentIds } }, { sellerId: { in: studentIds } }] } });
    await prisma.blockedUser.deleteMany({ where: { OR: [{ blockerId: { in: studentIds } }, { blockedId: { in: studentIds } }] } });
    await prisma.report.deleteMany({ where: { reporterId: { in: studentIds } } });
    await prisma.marketplaceProduct.deleteMany({ where: { sellerId: { in: studentIds } } });
    await prisma.resource.deleteMany({ where: { uploaderId: { in: studentIds } } });

    // Finally delete all student users
    const deleted = await prisma.user.deleteMany({
      where: { role: 'STUDENT' },
    });

    console.log(`✅ Successfully deleted ${deleted.count} student accounts.`);
  }

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, prn: true },
  });

  console.log('\n🏛️ Remaining Faculty, HoD, and Admin Accounts:');
  console.table(remainingUsers);

  await prisma.$disconnect();
}

clearStudents().catch((err) => {
  console.error('❌ Error clearing student accounts:', err);
  process.exit(1);
});
