const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.studentDocument.findMany({
    include: {
      student: {
        select: { id: true, email: true, fullName: true, role: true, prn: true }
      }
    }
  });
  console.log(`TOTAL DOCUMENTS IN DB: ${docs.length}`);
  for (const d of docs) {
    console.log(`- ID ${d.id}: "${d.documentName}" | Status: ${d.status} | Verification: ${d.verificationStatus} | Student: ${d.student?.fullName} (${d.student?.email}, USN: ${d.student?.prn})`);
  }
}

main().finally(() => prisma.$disconnect());
