import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('SuperAdmin@123', 10);
  await prisma.user.upsert({
    where: { email: 'superadmin@hrms.local' },
    update: {},
    create: {
      email: 'superadmin@hrms.local',
      passwordHash,
      name: 'Platform Super Admin',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('Seeded super admin: superadmin@hrms.local / SuperAdmin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
