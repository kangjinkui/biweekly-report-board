ALTER TABLE "ReportCycle"
ADD COLUMN "shareToken" TEXT;

UPDATE "ReportCycle"
SET "shareToken" = md5(random()::text || clock_timestamp()::text || id::text)
WHERE "shareToken" IS NULL;

CREATE UNIQUE INDEX "ReportCycle_shareToken_key" ON "ReportCycle"("shareToken");
