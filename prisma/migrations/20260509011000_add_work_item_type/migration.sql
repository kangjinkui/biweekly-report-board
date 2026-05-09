CREATE TYPE "WorkItemType" AS ENUM ('previous_only', 'current_only', 'both');

ALTER TABLE "WorkItem"
ADD COLUMN "itemType" "WorkItemType" NOT NULL DEFAULT 'both';
