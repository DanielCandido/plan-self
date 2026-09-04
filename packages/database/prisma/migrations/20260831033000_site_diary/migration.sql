CREATE TABLE "SiteDiary" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "reportDate" TIMESTAMP(3) NOT NULL,
  "weather" TEXT, "temperature" DOUBLE PRECISION, "workforce" JSONB NOT NULL,
  "equipment" JSONB NOT NULL, "services" JSONB NOT NULL, "occurrences" JSONB NOT NULL,
  "notes" TEXT, "status" TEXT NOT NULL DEFAULT 'DRAFT', "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteDiary_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SiteDiaryPhoto" (
  "id" TEXT NOT NULL, "siteDiaryId" TEXT NOT NULL, "storageKey" TEXT NOT NULL,
  "originalName" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL, "caption" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteDiaryPhoto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SiteDiary_projectId_reportDate_key" ON "SiteDiary"("projectId", "reportDate");
CREATE INDEX "SiteDiary_projectId_reportDate_idx" ON "SiteDiary"("projectId", "reportDate");
CREATE UNIQUE INDEX "SiteDiaryPhoto_storageKey_key" ON "SiteDiaryPhoto"("storageKey");
CREATE INDEX "SiteDiaryPhoto_siteDiaryId_createdAt_idx" ON "SiteDiaryPhoto"("siteDiaryId", "createdAt");
ALTER TABLE "SiteDiary" ADD CONSTRAINT "SiteDiary_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteDiaryPhoto" ADD CONSTRAINT "SiteDiaryPhoto_siteDiaryId_fkey" FOREIGN KEY ("siteDiaryId") REFERENCES "SiteDiary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
