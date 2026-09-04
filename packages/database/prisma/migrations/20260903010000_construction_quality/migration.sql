ALTER TABLE "ProjectFile"
ADD COLUMN "documentCode" TEXT,
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN "discipline" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'CURRENT';

CREATE TABLE "ConstructionInspection" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "inspectionDate" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "inspectorId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "checklist" JSONB NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConstructionInspection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NonConformity" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "inspectionId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "responsibleId" TEXT,
  "dueDate" TIMESTAMP(3),
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NonConformity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConstructionInspection_projectId_inspectionDate_idx" ON "ConstructionInspection"("projectId", "inspectionDate");
CREATE INDEX "ConstructionInspection_projectId_status_idx" ON "ConstructionInspection"("projectId", "status");
CREATE UNIQUE INDEX "NonConformity_projectId_code_key" ON "NonConformity"("projectId", "code");
CREATE INDEX "NonConformity_projectId_status_dueDate_idx" ON "NonConformity"("projectId", "status", "dueDate");
CREATE INDEX "NonConformity_inspectionId_idx" ON "NonConformity"("inspectionId");

ALTER TABLE "ConstructionInspection" ADD CONSTRAINT "ConstructionInspection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConstructionInspection" ADD CONSTRAINT "ConstructionInspection_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "ConstructionInspection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
