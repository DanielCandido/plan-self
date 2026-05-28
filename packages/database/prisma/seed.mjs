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

  const project = await prisma.project.upsert({
    where: { id: 'seed-kanban-project' },
    update: {
      name: 'Kanban Transformation',
      description: 'Roadmap incremental para board/sprint/task',
      organizationId: organization.id,
      ownerId: user.id,
      teamId: coreEngineering.id,
      archived: false,
      progress: 42,
    },
    create: {
      id: 'seed-kanban-project',
      name: 'Kanban Transformation',
      description: 'Roadmap incremental para board/sprint/task',
      organizationId: organization.id,
      ownerId: user.id,
      teamId: coreEngineering.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      progress: 42,
      color: '#22c55e',
    },
  });

  const board = await prisma.board.upsert({
    where: { projectId: project.id },
    update: {},
    create: { projectId: project.id },
  });

  const columnDefinitions = [
    { name: 'Backlog', order: 0, type: 'BACKLOG' },
    { name: 'Todo', order: 1, type: 'TODO' },
    { name: 'In Progress', order: 2, type: 'IN_PROGRESS', wipLimit: 6 },
    { name: 'Review', order: 3, type: 'REVIEW', wipLimit: 5 },
    { name: 'Done', order: 4, type: 'DONE' },
    { name: 'Blocked', order: 5, type: 'BLOCKED', wipLimit: 4 },
  ];

  const columns = await Promise.all(
    columnDefinitions.map((column) =>
      prisma.boardColumn.upsert({
        where: { boardId_name: { boardId: board.id, name: column.name } },
        update: {
          order: column.order,
          type: column.type,
          wipLimit: column.wipLimit ?? null,
        },
        create: {
          boardId: board.id,
          name: column.name,
          order: column.order,
          type: column.type,
          wipLimit: column.wipLimit ?? null,
        },
      }),
    ),
  );

  const activeSprint = await prisma.sprint.upsert({
    where: { id: 'seed-active-sprint' },
    update: {
      projectId: project.id,
      name: 'Sprint 24 - Premium Kanban',
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      velocity: 34,
      storyPoints: 21,
      completedPoints: 8,
      remainingPoints: 13,
      blockedPoints: 3,
      goal: 'Entregar base de board por colunas com realtime',
      createdBy: user.id,
    },
    create: {
      id: 'seed-active-sprint',
      projectId: project.id,
      name: 'Sprint 24 - Premium Kanban',
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      velocity: 34,
      storyPoints: 21,
      completedPoints: 8,
      remainingPoints: 13,
      blockedPoints: 3,
      goal: 'Entregar base de board por colunas com realtime',
      createdBy: user.id,
    },
  });

  const columnByType = new Map(columns.map((column) => [column.type, column]));

  const taskSeeds = [
    {
      id: 'seed-task-backlog',
      code: 'KAN-001',
      title: 'Criar endpoint GET /boards/:projectId',
      status: 'BACKLOG',
      points: 5,
      position: 0,
    },
    {
      id: 'seed-task-progress',
      code: 'KAN-002',
      title: 'Adicionar controle de concorrência no move/reorder',
      status: 'IN_PROGRESS',
      points: 8,
      position: 0,
      sprintId: activeSprint.id,
    },
    {
      id: 'seed-task-done',
      code: 'KAN-003',
      title: 'Implementar soft delete de task',
      status: 'DONE',
      points: 3,
      position: 0,
      sprintId: activeSprint.id,
    },
  ];

  await Promise.all(
    taskSeeds.map((item) => {
      const column = columnByType.get(item.status);
      return prisma.task.upsert({
        where: { id: item.id },
        update: {
          projectId: project.id,
          boardId: board.id,
          boardColumnId: column?.id ?? null,
          sprintId: item.sprintId ?? null,
          title: item.title,
          code: item.code,
          status: item.status,
          state: item.status,
          points: item.points,
          storyPoints: item.points,
          position: item.position,
          sortOrder: item.position,
          createdBy: user.id,
          updatedBy: user.id,
        },
        create: {
          id: item.id,
          projectId: project.id,
          boardId: board.id,
          boardColumnId: column?.id ?? null,
          sprintId: item.sprintId ?? null,
          title: item.title,
          code: item.code,
          status: item.status,
          state: item.status,
          points: item.points,
          storyPoints: item.points,
          position: item.position,
          sortOrder: item.position,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
    }),
  );

  await prisma.sprintMetric.create({
    data: {
      sprintId: activeSprint.id,
      totalStoryPoints: 21,
      completedPoints: 8,
      remainingPoints: 13,
      blockedPoints: 3,
      progress: 38,
      velocity: 34,
      throughput: 1,
      capacityUtilization: 0.72,
      healthScore: 82,
    },
  });

  await prisma.burndownSnapshot.upsert({
    where: {
      sprintId_snapshotDate: {
        sprintId: activeSprint.id,
        snapshotDate: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    update: {
      remainingPoints: 13,
      completedPoints: 8,
      blockedTasks: 1,
    },
    create: {
      sprintId: activeSprint.id,
      snapshotDate: new Date(new Date().setHours(0, 0, 0, 0)),
      remainingPoints: 13,
      completedPoints: 8,
      blockedTasks: 1,
    },
  });

  console.log('seeded', {
    organizationId: organization.id,
    userEmail: user.email,
    teams: 3,
    projectId: project.id,
    sprintId: activeSprint.id,
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
