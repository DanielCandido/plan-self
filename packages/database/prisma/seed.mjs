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

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alex@planself.io' },
      update: {
        name: 'Alex Rivero',
        passwordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
      create: {
        email: 'alex@planself.io',
        name: 'Alex Rivero',
        passwordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jordan@planself.io' },
      update: {
        name: 'Jordan S. Chen',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
      create: {
        email: 'jordan@planself.io',
        name: 'Jordan S. Chen',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 's.miller@planself.io' },
      update: {
        name: 'Sarah Miller',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
      create: {
        email: 's.miller@planself.io',
        name: 'Sarah Miller',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'marcus@planself.io' },
      update: {
        name: 'Marcus Thorne',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
      create: {
        email: 'marcus@planself.io',
        name: 'Marcus Thorne',
        passwordHash,
        role: 'MEMBER',
        status: 'ACTIVE',
        organizationId: organization.id,
      },
    }),
  ]);

  const [coreEngineering, designOps, productGrowth] = await Promise.all([
    prisma.team.upsert({
      where: { organizationId_slug: { organizationId: organization.id, slug: 'core-engineering' } },
      update: {
        name: 'Core Engineering',
        description: 'Responsible for infrastructure, security, and the core API layer.',
        color: '#7c3aed',
        visibility: 'PRIVATE',
        ownerId: user.id,
        archivedAt: null,
      },
      create: {
        organizationId: organization.id,
        name: 'Core Engineering',
        slug: 'core-engineering',
        description: 'Responsible for infrastructure, security, and the core API layer.',
        color: '#7c3aed',
        visibility: 'PRIVATE',
        ownerId: user.id,
      },
    }),
    prisma.team.upsert({
      where: { organizationId_slug: { organizationId: organization.id, slug: 'design-ops' } },
      update: {
        name: 'Design Ops',
        description: 'Maintaining the design system and user research documentation.',
        color: '#0ea5e9',
        visibility: 'PRIVATE',
        ownerId: user.id,
        archivedAt: null,
      },
      create: {
        organizationId: organization.id,
        name: 'Design Ops',
        slug: 'design-ops',
        description: 'Maintaining the design system and user research documentation.',
        color: '#0ea5e9',
        visibility: 'PRIVATE',
        ownerId: user.id,
      },
    }),
    prisma.team.upsert({
      where: { organizationId_slug: { organizationId: organization.id, slug: 'product-growth' } },
      update: {
        name: 'Product Growth',
        description: 'Optimizing user onboarding flow and conversion funnels.',
        color: '#f59e0b',
        visibility: 'PRIVATE',
        ownerId: user.id,
        archivedAt: null,
      },
      create: {
        organizationId: organization.id,
        name: 'Product Growth',
        slug: 'product-growth',
        description: 'Optimizing user onboarding flow and conversion funnels.',
        color: '#f59e0b',
        visibility: 'PRIVATE',
        ownerId: user.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: coreEngineering.id, userId: user.id } },
      update: { role: 'OWNER', status: 'ONLINE', workload: 72, suspendedAt: null },
      create: { teamId: coreEngineering.id, userId: user.id, role: 'OWNER', status: 'ONLINE', workload: 72 },
    }),
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: coreEngineering.id, userId: users[0].id } },
      update: { role: 'MANAGER', status: 'ONLINE', workload: 65, suspendedAt: null },
      create: { teamId: coreEngineering.id, userId: users[0].id, role: 'MANAGER', status: 'ONLINE', workload: 65 },
    }),
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: designOps.id, userId: users[1].id } },
      update: { role: 'MEMBER', status: 'IN_MEETING', workload: 40, suspendedAt: null },
      create: { teamId: designOps.id, userId: users[1].id, role: 'MEMBER', status: 'IN_MEETING', workload: 40 },
    }),
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: productGrowth.id, userId: users[2].id } },
      update: { role: 'MEMBER', status: 'OFFLINE', workload: 66, suspendedAt: null },
      create: { teamId: productGrowth.id, userId: users[2].id, role: 'MEMBER', status: 'OFFLINE', workload: 66 },
    }),
    prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: coreEngineering.id, userId: users[3].id } },
      update: { role: 'MEMBER', status: 'ONLINE', workload: 25, suspendedAt: null },
      create: { teamId: coreEngineering.id, userId: users[3].id, role: 'MEMBER', status: 'ONLINE', workload: 25 },
    }),
  ]);

  await prisma.teamInvite.upsert({
    where: { token: 'seed-invite-core-engineering' },
    update: {
      email: 'new.hire@planself.io',
      organizationId: organization.id,
      teamId: coreEngineering.id,
      invitedById: user.id,
      role: 'MEMBER',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      acceptedAt: null,
      revokedAt: null,
    },
    create: {
      token: 'seed-invite-core-engineering',
      email: 'new.hire@planself.io',
      organizationId: organization.id,
      teamId: coreEngineering.id,
      invitedById: user.id,
      role: 'MEMBER',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('seeded', { organizationId: organization.id, userEmail: user.email, teams: 3 });
}

main().finally(async () => {
  await prisma.$disconnect();
});
