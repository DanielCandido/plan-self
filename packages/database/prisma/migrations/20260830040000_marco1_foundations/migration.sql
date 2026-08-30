CREATE TYPE "ProjectProfile" AS ENUM ('GENERAL', 'CONSTRUCTION_SITE');
CREATE TYPE "ProjectMemberRole" AS ENUM ('OWNER', 'MANAGER', 'CONTRIBUTOR', 'VIEWER');
CREATE TYPE "WbsNodeType" AS ENUM ('PHASE', 'DELIVERABLE', 'WORK_PACKAGE');
CREATE TYPE "TaskDependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

ALTER TABLE "Project" ADD COLUMN "profile" "ProjectProfile" NOT NULL DEFAULT 'GENERAL';

CREATE TABLE "ProjectMember" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ProjectMemberRole" NOT NULL DEFAULT 'CONTRIBUTOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProjectMember" ("id", "projectId", "userId", "role", "createdAt", "updatedAt")
SELECT CONCAT('pm_', SUBSTRING(MD5(RANDOM()::text || p."id" || tm."userId") FROM 1 FOR 22)),
       p."id",
       tm."userId",
       CASE tm."role"::text
         WHEN 'OWNER' THEN 'OWNER'::"ProjectMemberRole"
         WHEN 'ADMIN' THEN 'MANAGER'::"ProjectMemberRole"
         WHEN 'MANAGER' THEN 'MANAGER'::"ProjectMemberRole"
         WHEN 'GUEST' THEN 'VIEWER'::"ProjectMemberRole"
         ELSE 'CONTRIBUTOR'::"ProjectMemberRole"
       END,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "Project" p
INNER JOIN "TeamMember" tm ON tm."teamId" = p."teamId"
ON CONFLICT DO NOTHING;

INSERT INTO "ProjectMember" ("id", "projectId", "userId", "role", "createdAt", "updatedAt")
SELECT CONCAT('pm_', SUBSTRING(MD5(RANDOM()::text || p."id" || p."ownerId") FROM 1 FOR 22)),
       p."id", p."ownerId", 'OWNER'::"ProjectMemberRole", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Project" p
WHERE p."ownerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = p."id" AND pm."userId" = p."ownerId"
  )
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WbsNode" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "parentId" TEXT,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "WbsNodeType" NOT NULL DEFAULT 'WORK_PACKAGE',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WbsNode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WbsNode_projectId_code_key" ON "WbsNode"("projectId", "code");
CREATE INDEX "WbsNode_projectId_parentId_position_idx" ON "WbsNode"("projectId", "parentId", "position");
ALTER TABLE "WbsNode" ADD CONSTRAINT "WbsNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WbsNode" ADD CONSTRAINT "WbsNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WbsNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" ADD COLUMN "wbsNodeId" TEXT;
CREATE INDEX "Task_wbsNodeId_idx" ON "Task"("wbsNodeId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TaskDependency"
  ADD COLUMN "type" "TaskDependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
  ADD COLUMN "lagDays" INTEGER NOT NULL DEFAULT 0;
