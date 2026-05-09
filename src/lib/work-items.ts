export const WORK_ITEM_TYPES = [
  "previous_only",
  "current_only",
  "both",
] as const;

export type WorkItemType = (typeof WORK_ITEM_TYPES)[number];

export const WORK_ITEM_TYPE_LABELS: Record<WorkItemType, string> = {
  previous_only: "실적만",
  current_only: "계획만",
  both: "실적+계획",
};

export function isWorkItemType(value: unknown): value is WorkItemType {
  return (
    typeof value === "string" &&
    WORK_ITEM_TYPES.includes(value as WorkItemType)
  );
}

export function normalizeWorkItemType(value: unknown): WorkItemType {
  return isWorkItemType(value) ? value : "both";
}

export function usesPrevious(type: WorkItemType) {
  return type !== "current_only";
}

export function usesCurrent(type: WorkItemType) {
  return type !== "previous_only";
}
