ALTER TABLE "Team"
ADD COLUMN "departmentName" TEXT NOT NULL DEFAULT '도시계획과';

CREATE INDEX "Team_departmentName_displayOrder_idx" ON "Team"("departmentName", "displayOrder");
