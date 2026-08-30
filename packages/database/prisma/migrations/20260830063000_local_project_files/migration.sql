CREATE TABLE "ProjectFile" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FileRevision" (
  "id" TEXT NOT NULL,
  "projectFileId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "note" TEXT,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FileRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectFile_projectId_name_key" ON "ProjectFile"("projectId", "name");
CREATE INDEX "ProjectFile_projectId_deletedAt_idx" ON "ProjectFile"("projectId", "deletedAt");
CREATE UNIQUE INDEX "FileRevision_storageKey_key" ON "FileRevision"("storageKey");
CREATE UNIQUE INDEX "FileRevision_projectFileId_revision_key" ON "FileRevision"("projectFileId", "revision");
CREATE INDEX "FileRevision_projectFileId_createdAt_idx" ON "FileRevision"("projectFileId", "createdAt");
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileRevision" ADD CONSTRAINT "FileRevision_projectFileId_fkey" FOREIGN KEY ("projectFileId") REFERENCES "ProjectFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FileRevision" ADD CONSTRAINT "FileRevision_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
