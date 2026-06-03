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

  await prisma.service.createMany({
    data: [
      {
        name: 'Diagnostico',
        description: 'Revision inicial del equipo y orientacion del problema.',
        price: 10000,
      },
      {
        name: 'Formateo',
        description: 'Instalacion limpia de sistema operativo y configuracion base.',
        price: 25000,
      },
      {
        name: 'Limpieza',
        description: 'Limpieza interna preventiva para equipos de escritorio o notebook.',
        price: 18000,
      },
      {
        name: 'Cambio de pantalla',
        description: 'Evaluacion y reemplazo de pantalla compatible.',
        price: 35000,
      },
      {
        name: 'Cambio de bateria',
        description: 'Evaluacion y reemplazo de bateria compatible.',
        price: 30000,
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
