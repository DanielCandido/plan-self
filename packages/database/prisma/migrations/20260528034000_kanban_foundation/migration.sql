-- CreateEnum
CREATE TYPE "BoardColumnType" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'MOVED', 'STATUS_CHANGED', 'DELETED', 'RESTORED', 'COMMENTED');

-- AlterTable
ALTER TABLE "Task"
  ADD COLUMN "code" TEXT,
  ADD COLUMN "boardId" TEXT,
  ADD COLUMN "boardColumnId" TEXT,
  ADD COLUMN "status" "TaskState" NOT NULL DEFAULT 'BACKLOG',
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "points" INTEGER,
  ADD COLUMN "blocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "dueDate" TIMESTAMP(3),
  ADD COLUMN "createdBy" TEXT,
  ADD COLUMN "updatedBy" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Backfill
WITH numbered_tasks AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS "code_order"
  FROM "Task"
)
UPDATE "Task" t
SET
  "status" = t."state",
  "position" = t."sortOrder",
  "points" = t."storyPoints",
  "blocked" = CASE WHEN t."blockedReason" IS NULL OR LENGTH(TRIM(t."blockedReason")) = 0 THEN false ELSE true END,
  "dueDate" = t."dueAt",
  "code" = CONCAT('TSK-', LPAD(numbered_tasks."code_order"::text, 6, '0'))
FROM numbered_tasks
WHERE numbered_tasks."id" = t."id";

-- CreateTable
CREATE TABLE "Board" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardColumn" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "wipLimit" INTEGER,
  "type" "BoardColumnType" NOT NULL DEFAULT 'TODO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskHistory" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "TaskHistoryAction" NOT NULL,
  "fromStatus" "TaskState",
  "toStatus" "TaskState",
  "fromColumnId" TEXT,
  "toColumnId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "Task_code_key" ON "Task"("code");
CREATE UNIQUE INDEX "Board_projectId_key" ON "Board"("projectId");
CREATE UNIQUE INDEX "BoardColumn_boardId_name_key" ON "BoardColumn"("boardId", "name");
CREATE INDEX "BoardColumn_boardId_order_idx" ON "BoardColumn"("boardId", "order");
CREATE INDEX "Task_projectId_deletedAt_idx" ON "Task"("projectId", "deletedAt");
CREATE INDEX "Task_boardColumnId_position_idx" ON "Task"("boardColumnId", "position");
CREATE INDEX "TaskHistory_taskId_createdAt_idx" ON "TaskHistory"("taskId", "createdAt");
CREATE INDEX "TaskHistory_actorId_createdAt_idx" ON "TaskHistory"("actorId", "createdAt");
CREATE UNIQUE INDEX "Label_projectId_name_key" ON "Label"("projectId", "name");
CREATE INDEX "Label_projectId_createdAt_idx" ON "Label"("projectId", "createdAt");

-- Foreign keys
ALTER TABLE "Board" ADD CONSTRAINT "Board_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardColumn" ADD CONSTRAINT "BoardColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardColumnId_fkey" FOREIGN KEY ("boardColumnId") REFERENCES "BoardColumn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Label" ADD CONSTRAINT "Label_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Label" ADD CONSTRAINT "Label_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Default board/columns per existing projects
INSERT INTO "Board" ("id", "projectId", "createdAt", "updatedAt")
SELECT CONCAT('board_', SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 24)), p."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Project" p
LEFT JOIN "Board" b ON b."projectId" = p."id"
WHERE b."id" IS NULL;

INSERT INTO "BoardColumn" ("id", "boardId", "name", "order", "wipLimit", "type", "createdAt", "updatedAt")
SELECT CONCAT('col_', SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text || b."id" || c."name") FROM 1 FOR 24)), b."id", c."name", c."order", c."wipLimit", c."type"::"BoardColumnType", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Board" b
CROSS JOIN (
  VALUES
    ('Backlog', 0, NULL, 'BACKLOG'),
    ('Todo', 1, NULL, 'TODO'),
    ('In Progress', 2, 6, 'IN_PROGRESS'),
    ('Review', 3, 5, 'REVIEW'),
    ('Done', 4, NULL, 'DONE'),
    ('Blocked', 5, 4, 'BLOCKED')
) AS c("name", "order", "wipLimit", "type")
ON CONFLICT ("boardId", "name") DO NOTHING;

UPDATE "Task" t
SET "boardId" = b."id"
FROM "Board" b
WHERE t."projectId" = b."projectId"
  AND t."boardId" IS NULL;
