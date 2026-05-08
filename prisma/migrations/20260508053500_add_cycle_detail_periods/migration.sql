ALTER TABLE "ReportCycle"
ADD COLUMN "previousStartDate" DATE,
ADD COLUMN "previousEndDate" DATE,
ADD COLUMN "currentStartDate" DATE,
ADD COLUMN "currentEndDate" DATE;

UPDATE "ReportCycle"
SET
  "previousStartDate" = "startDate",
  "previousEndDate" = LEAST(("startDate" + INTERVAL '6 days')::date, "endDate"),
  "currentStartDate" = LEAST(("startDate" + INTERVAL '7 days')::date, "endDate"),
  "currentEndDate" = "endDate";

ALTER TABLE "ReportCycle"
ALTER COLUMN "previousStartDate" SET NOT NULL,
ALTER COLUMN "previousEndDate" SET NOT NULL,
ALTER COLUMN "currentStartDate" SET NOT NULL,
ALTER COLUMN "currentEndDate" SET NOT NULL;

CREATE INDEX "ReportCycle_previousStartDate_previousEndDate_idx" ON "ReportCycle"("previousStartDate", "previousEndDate");
CREATE INDEX "ReportCycle_currentStartDate_currentEndDate_idx" ON "ReportCycle"("currentStartDate", "currentEndDate");
