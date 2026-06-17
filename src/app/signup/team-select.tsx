"use client";

import { useMemo, useState } from "react";
import { DEPARTMENT_NAMES, type DepartmentName } from "@/lib/organization";

type TeamOption = {
  id: string;
  name: string;
  departmentName: string;
};

export function TeamSelect({ teams }: { teams: TeamOption[] }) {
  const [departmentName, setDepartmentName] = useState<DepartmentName>(DEPARTMENT_NAMES[0]);

  const filteredTeams = useMemo(
    () => teams.filter((team) => team.departmentName === departmentName),
    [departmentName, teams],
  );

  return (
    <>
      <label>
        <span className="mb-2 block text-sm font-semibold">소속 과</span>
        <select
          name="departmentName"
          value={departmentName}
          onChange={(event) => setDepartmentName(event.target.value as DepartmentName)}
          className="w-full border border-[#c8d3df] px-3 py-2"
        >
          {DEPARTMENT_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="mb-2 block text-sm font-semibold">팀</span>
        <select name="teamId" className="w-full border border-[#c8d3df] px-3 py-2" required>
          {filteredTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
