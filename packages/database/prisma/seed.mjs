import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Organization',
      slug: 'default',
    },
  });

  const passwordHash = await bcrypt.hash('admin123', 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@plan-self.local' },
    update: {
      name: 'Plan Self Admin',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
    create: {
      email: 'admin@plan-self.local',
      name: 'Plan Self Admin',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
  });

  console.log('seeded', { organizationId: organization.id, userEmail: user.email });
}

main().finally(async () => {
  await prisma.$disconnect();
});
