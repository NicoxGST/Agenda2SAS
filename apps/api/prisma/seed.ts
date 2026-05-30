import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  await prisma.user.createMany({
    data: [
      {
        name: 'Admin',
        email: 'admin@test.com',
        password,
        role: Role.SUPER_ADMIN,
      },
      {
        name: 'Worker',
        email: 'worker@test.com',
        password,
        role: Role.WORKER,
      },
      {
        name: 'Client',
        email: 'client@test.com',
        password,
        role: Role.CLIENT,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completado');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
