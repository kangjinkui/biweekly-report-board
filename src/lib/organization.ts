export const BUREAU_NAME = "도시환경국";

export const DEPARTMENT_NAMES = [
  "주택과",
  "재건축사업과",
  "도시계획과",
  "건축과",
  "환경과",
  "공원녹지과",
  "부동산정보과",
] as const;

export type DepartmentName = (typeof DEPARTMENT_NAMES)[number];

const DEPARTMENT_ORDER = new Map<string, number>(
  DEPARTMENT_NAMES.map((departmentName, index) => [departmentName, index]),
);

export function isDepartmentName(value: string): value is DepartmentName {
  return DEPARTMENT_NAMES.includes(value as DepartmentName);
}

export function compareDepartmentNames(a: string, b: string) {
  const orderA = DEPARTMENT_ORDER.get(a) ?? Number.MAX_SAFE_INTEGER;
  const orderB = DEPARTMENT_ORDER.get(b) ?? Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) return orderA - orderB;
  return a.localeCompare(b, "ko-KR");
}

export function compareTeamsByDepartmentOrder(
  a: { departmentName: string; displayOrder: number; name: string },
  b: { departmentName: string; displayOrder: number; name: string },
) {
  const departmentOrder = compareDepartmentNames(a.departmentName, b.departmentName);
  if (departmentOrder !== 0) return departmentOrder;

  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return a.name.localeCompare(b.name, "ko-KR");
}

export function compareReportEntriesByDepartmentOrder(
  a: { team: { departmentName: string; displayOrder: number; name: string } },
  b: { team: { departmentName: string; displayOrder: number; name: string } },
) {
  return compareTeamsByDepartmentOrder(a.team, b.team);
}
