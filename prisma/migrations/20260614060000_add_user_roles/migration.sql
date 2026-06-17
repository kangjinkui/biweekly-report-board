CREATE TYPE "AdminRole" AS ENUM ('super_admin', 'department_manager', 'team_user');
CREATE TYPE "UserStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "AdminUser"
  ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'team_user',
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN "teamId" UUID,
  ADD COLUMN "managedDepartmentName" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "approvedById" UUID;

UPDATE "AdminUser"
SET "role" = 'super_admin',
    "status" = 'approved',
    "approvedAt" = COALESCE("approvedAt", NOW()),
    "name" = COALESCE(NULLIF("name", ''), "email");

CREATE INDEX "AdminUser_role_status_idx" ON "AdminUser"("role", "status");
CREATE INDEX "AdminUser_teamId_idx" ON "AdminUser"("teamId");
CREATE INDEX "AdminUser_managedDepartmentName_idx" ON "AdminUser"("managedDepartmentName");

ALTER TABLE "AdminUser"
  ADD CONSTRAINT "AdminUser_teamId_fkey"
  FOREIGN KEY ("teamId")
  REFERENCES "Team"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "AdminUser"
  ADD CONSTRAINT "AdminUser_approvedById_fkey"
  FOREIGN KEY ("approvedById")
  REFERENCES "AdminUser"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
