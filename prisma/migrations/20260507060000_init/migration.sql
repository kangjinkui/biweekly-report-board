CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "ReportCycleStatus" AS ENUM ('draft', 'completed');
CREATE TYPE "ReportEntryStatus" AS ENUM ('not_started', 'in_progress', 'submitted', 'needs_revision', 'completed');

CREATE TABLE "Team" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "displayOrder" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "writeTokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportCycle" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "dueDate" DATE NOT NULL,
  "status" "ReportCycleStatus" NOT NULL DEFAULT 'draft',
  "shareTokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReportCycle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReportEntry" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reportCycleId" UUID NOT NULL,
  "teamId" UUID NOT NULL,
  "status" "ReportEntryStatus" NOT NULL DEFAULT 'not_started',
  "submittedAt" TIMESTAMP(3),
  "authorName" TEXT,
  "lastEditedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ReportEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkItem" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "reportEntryId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "nextPlan" TEXT NOT NULL,
  "note" TEXT,
  "displayOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "adminUserId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_writeTokenHash_key" ON "Team"("writeTokenHash");
CREATE INDEX "Team_isActive_displayOrder_idx" ON "Team"("isActive", "displayOrder");

CREATE UNIQUE INDEX "ReportCycle_shareTokenHash_key" ON "ReportCycle"("shareTokenHash");
CREATE INDEX "ReportCycle_status_dueDate_idx" ON "ReportCycle"("status", "dueDate");
CREATE INDEX "ReportCycle_startDate_endDate_idx" ON "ReportCycle"("startDate", "endDate");

CREATE UNIQUE INDEX "ReportEntry_reportCycleId_teamId_key" ON "ReportEntry"("reportCycleId", "teamId");
CREATE INDEX "ReportEntry_teamId_status_idx" ON "ReportEntry"("teamId", "status");

CREATE INDEX "WorkItem_reportEntryId_displayOrder_idx" ON "WorkItem"("reportEntryId", "displayOrder");

CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_adminUserId_idx" ON "Session"("adminUserId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

ALTER TABLE "ReportEntry"
  ADD CONSTRAINT "ReportEntry_reportCycleId_fkey"
  FOREIGN KEY ("reportCycleId")
  REFERENCES "ReportCycle"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "ReportEntry"
  ADD CONSTRAINT "ReportEntry_teamId_fkey"
  FOREIGN KEY ("teamId")
  REFERENCES "Team"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "WorkItem"
  ADD CONSTRAINT "WorkItem_reportEntryId_fkey"
  FOREIGN KEY ("reportEntryId")
  REFERENCES "ReportEntry"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_adminUserId_fkey"
  FOREIGN KEY ("adminUserId")
  REFERENCES "AdminUser"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
