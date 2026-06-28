import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { isVerified: false },
    data: { isVerified: true },
  });

  console.log(`${result.count} usuarios marcados como verificados`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
