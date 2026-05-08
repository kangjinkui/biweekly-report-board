export const BUREAU_NAME = "도시환경국";

export const DEPARTMENT_NAMES = [
  "재건축사업과",
  "도시계획과",
  "건축과",
  "환경과",
  "공원녹지과",
  "부동산정보과",
] as const;

export type DepartmentName = (typeof DEPARTMENT_NAMES)[number];

export function isDepartmentName(value: string): value is DepartmentName {
  return DEPARTMENT_NAMES.includes(value as DepartmentName);
}
