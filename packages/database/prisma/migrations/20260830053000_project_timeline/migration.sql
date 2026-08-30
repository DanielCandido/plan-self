ALTER TABLE "Task"
  ADD COLUMN "plannedStart" TIMESTAMP(3),
  ADD COLUMN "plannedEnd" TIMESTAMP(3);

UPDATE "Task"
SET "plannedEnd" = "dueAt"
WHERE "dueAt" IS NOT NULL AND "plannedEnd" IS NULL;

CREATE INDEX "Task_projectId_plannedStart_plannedEnd_idx"
  ON "Task"("projectId", "plannedStart", "plannedEnd");
