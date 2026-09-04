CREATE TABLE "ConstructionProject" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "siteName" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "clientName" TEXT,
  "clientDocument" TEXT,
  "technicalManagerName" TEXT,
  "technicalManagerRegistry" TEXT,
  "artNumber" TEXT,
  "permitNumber" TEXT,
  "contractNumber" TEXT,
  "plannedStart" TIMESTAMP(3),
  "plannedEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConstructionProject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ConstructionProject_projectId_key" ON "ConstructionProject"("projectId");
ALTER TABLE "ConstructionProject" ADD CONSTRAINT "ConstructionProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
