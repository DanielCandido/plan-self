-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SprintAuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'TASK_ADDED', 'TASK_REMOVED', 'STARTED', 'COMPLETED', 'CANCELLED', 'DATES_CHANGED');

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "blockedPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "healthScore" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "remainingPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "velocity" SET NOT NULL,
ALTER COLUMN "velocity" SET DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "storyPoints" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SprintTask" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" TEXT NOT NULL,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "SprintTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintMetric" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "totalStoryPoints" INTEGER NOT NULL DEFAULT 0,
    "completedPoints" INTEGER NOT NULL DEFAULT 0,
    "remainingPoints" INTEGER NOT NULL DEFAULT 0,
    "blockedPoints" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "velocity" INTEGER NOT NULL DEFAULT 0,
    "throughput" INTEGER NOT NULL DEFAULT 0,
    "capacityUtilization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SprintMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurndownSnapshot" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "remainingPoints" INTEGER NOT NULL DEFAULT 0,
    "completedPoints" INTEGER NOT NULL DEFAULT 0,
    "blockedTasks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BurndownSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintAuditLog" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "SprintAuditAction" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SprintAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SprintMember" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyCapacity" INTEGER NOT NULL DEFAULT 8,
    "availabilityPercent" INTEGER NOT NULL DEFAULT 100,
    "totalCapacity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SprintMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "blockerTaskId" TEXT NOT NULL,
    "blockedTaskId" TEXT NOT NULL,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SprintTask_taskId_key" ON "SprintTask"("taskId");

-- CreateIndex
CREATE INDEX "SprintTask_sprintId_position_idx" ON "SprintTask"("sprintId", "position");

-- CreateIndex
CREATE INDEX "SprintMetric_sprintId_createdAt_idx" ON "SprintMetric"("sprintId", "createdAt");

-- CreateIndex
CREATE INDEX "BurndownSnapshot_sprintId_snapshotDate_idx" ON "BurndownSnapshot"("sprintId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "BurndownSnapshot_sprintId_snapshotDate_key" ON "BurndownSnapshot"("sprintId", "snapshotDate");

-- CreateIndex
CREATE INDEX "SprintAuditLog_sprintId_createdAt_idx" ON "SprintAuditLog"("sprintId", "createdAt");

-- CreateIndex
CREATE INDEX "SprintAuditLog_projectId_createdAt_idx" ON "SprintAuditLog"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SprintMember_sprintId_userId_key" ON "SprintMember"("sprintId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_blockerTaskId_blockedTaskId_key" ON "TaskDependency"("blockerTaskId", "blockedTaskId");

-- CreateIndex
CREATE INDEX "Sprint_projectId_status_idx" ON "Sprint"("projectId", "status");

-- CreateIndex
CREATE INDEX "Sprint_projectId_startDate_idx" ON "Sprint"("projectId", "startDate");

-- CreateIndex
CREATE INDEX "Task_projectId_sprintId_sortOrder_idx" ON "Task"("projectId", "sprintId", "sortOrder");

-- CreateIndex
CREATE INDEX "Task_projectId_state_idx" ON "Task"("projectId", "state");

-- AddForeignKey
ALTER TABLE "SprintTask" ADD CONSTRAINT "SprintTask_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintTask" ADD CONSTRAINT "SprintTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintMetric" ADD CONSTRAINT "SprintMetric_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurndownSnapshot" ADD CONSTRAINT "BurndownSnapshot_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintAuditLog" ADD CONSTRAINT "SprintAuditLog_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintAuditLog" ADD CONSTRAINT "SprintAuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintAuditLog" ADD CONSTRAINT "SprintAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintMember" ADD CONSTRAINT "SprintMember_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SprintMember" ADD CONSTRAINT "SprintMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_blockerTaskId_fkey" FOREIGN KEY ("blockerTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_blockedTaskId_fkey" FOREIGN KEY ("blockedTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

