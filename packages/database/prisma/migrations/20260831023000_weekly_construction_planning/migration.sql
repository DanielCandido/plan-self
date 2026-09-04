CREATE TABLE "WeeklyPlan" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "weekStart" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "notes" TEXT, "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WeeklyPlanItem" (
  "id" TEXT NOT NULL, "weeklyPlanId" TEXT NOT NULL, "wbsNodeId" TEXT, "taskId" TEXT,
  "description" TEXT NOT NULL, "unit" TEXT NOT NULL DEFAULT 'un',
  "plannedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0, "actualQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'PLANNED', "constraintNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WeeklyPlanItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WeeklyPlan_projectId_weekStart_key" ON "WeeklyPlan"("projectId", "weekStart");
CREATE INDEX "WeeklyPlan_projectId_status_weekStart_idx" ON "WeeklyPlan"("projectId", "status", "weekStart");
CREATE INDEX "WeeklyPlanItem_weeklyPlanId_status_idx" ON "WeeklyPlanItem"("weeklyPlanId", "status");
CREATE INDEX "WeeklyPlanItem_wbsNodeId_idx" ON "WeeklyPlanItem"("wbsNodeId");
CREATE INDEX "WeeklyPlanItem_taskId_idx" ON "WeeklyPlanItem"("taskId");
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
