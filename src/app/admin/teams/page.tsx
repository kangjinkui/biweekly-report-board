import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowUp, KeyRound, Plus, Power, Save, Users } from "lucide-react";
import {
  createTeam,
  moveTeam,
  rotateTeamWriteToken,
  toggleTeamActive,
  updateTeamName,
} from "./actions";
import { prisma } from "@/lib/prisma";
import { DEPARTMENT_NAMES } from "@/lib/organization";
import { PageShell } from "@/components/page-shell";

async function getTeams() {
  try {
    return {
      teams: await prisma.team.findMany({
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      }),
      error: null,
    };
  } catch {
    return {
      teams: [],
      error: "DB 연결 또는 마이그레이션 적용이 필요합니다.",
    };
  }
}

export default async function TeamsPage() {
  const { teams, error } = await getTeams();

  return (
    <PageShell
      title="팀 관리"
      description="과별 조직 구조에 맞춰 팀을 등록하고 작성 순서와 사용 여부를 관리합니다."
      actions={
        <>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            관리자 화면
          </Link>
          <button
            form="create-team-form"
            className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-semibold text-[#003f7d]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            팀 추가
          </button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="gov-section-title text-xl">팀 등록</h2>
        <button
          form="create-team-form"
          className="gov-action hidden items-center gap-2 px-4 py-2 text-sm font-semibold md:inline-flex"
        >
          <Plus className="h-4 w-4" aria-hidden />
          팀 추가
        </button>
      </div>

      <form
        id="create-team-form"
        action={createTeam}
        className="gov-panel grid gap-3 p-4 md:grid-cols-[1fr_220px]"
      >
        <label>
          <span className="mb-2 block text-sm font-semibold">새 팀명</span>
          <input
            name="name"
            placeholder="예: 도시계획팀"
            className="w-full border border-[#c8d3df] px-3 py-2"
            required
          />
        </label>
        <DepartmentSelect defaultValue="도시계획과" />
      </form>

      {error ? (
        <div className="gov-panel mt-6 p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[#005bac]" aria-hidden />
          <h2 className="mt-4 font-semibold">팀 목록을 아직 불러올 수 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="gov-panel mt-6 p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[#005bac]" aria-hidden />
          <h2 className="mt-4 font-semibold">등록된 팀이 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            위 입력칸에 팀명을 넣고 팀 추가를 눌러 시작하세요.
          </p>
        </div>
      ) : (
        <div className="gov-panel mt-6 overflow-hidden">
          <div className="grid grid-cols-[70px_1fr_110px_250px] border-b border-[#8fa9c1] bg-[#e8f1fa] px-4 py-3 text-sm font-semibold text-[#102a43]">
            <span>순서</span>
            <span>소속 과 / 팀명</span>
            <span>상태</span>
            <span>작업</span>
          </div>
          <div className="divide-y divide-[#c8d3df]">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="grid grid-cols-[70px_1fr_110px_250px] items-center gap-3 px-4 py-3"
              >
                <span className="text-sm text-[#667085]">{index + 1}</span>
                <form
                  action={updateTeamName}
                  className="grid grid-cols-[180px_1fr_auto] gap-2"
                >
                  <input type="hidden" name="id" value={team.id} />
                  <DepartmentSelect defaultValue={team.departmentName} hideLabel />
                  <input
                    name="name"
                    defaultValue={team.name}
                    className="w-full border border-[#c8d3df] px-3 py-2"
                    required
                  />
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center border border-[#8db8dd] text-[#005bac]"
                    title="팀명 저장"
                  >
                    <Save className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <span
                  className={
                    team.isActive
                      ? "text-sm font-semibold text-[#005bac]"
                      : "text-sm font-semibold text-[#667085]"
                  }
                >
                  {team.isActive ? "사용 중" : "미사용"}
                </span>
                <div className="flex gap-2">
                  <form action={moveTeam}>
                    <input type="hidden" name="id" value={team.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]"
                      title="위로 이동"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={moveTeam}>
                    <input type="hidden" name="id" value={team.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]"
                      title="아래로 이동"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={toggleTeamActive}>
                    <input type="hidden" name="id" value={team.id} />
                    <input type="hidden" name="isActive" value={String(team.isActive)} />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]"
                      title={team.isActive ? "미사용 처리" : "사용 처리"}
                    >
                      <Power className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={rotateTeamWriteToken}>
                    <input type="hidden" name="id" value={team.id} />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]"
                      title="작성 링크 재발급"
                    >
                      <KeyRound className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function DepartmentSelect({
  defaultValue,
  hideLabel = false,
}: {
  defaultValue: string;
  hideLabel?: boolean;
}) {
  return (
    <label>
      {hideLabel ? null : (
        <span className="mb-2 block text-sm font-semibold">소속 과</span>
      )}
      <select
        name="departmentName"
        defaultValue={defaultValue}
        className="w-full border border-[#c8d3df] px-3 py-2"
      >
        {DEPARTMENT_NAMES.map((departmentName) => (
          <option key={departmentName} value={departmentName}>
            {departmentName}
          </option>
        ))}
      </select>
    </label>
  );
}
