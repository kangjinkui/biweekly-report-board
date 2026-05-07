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
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#2457a7]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        관리자 화면
      </Link>
      <div className="mt-6 flex items-center justify-between border-b border-[#d6dbe1] pb-5">
        <div>
          <h1 className="text-2xl font-semibold">팀 관리</h1>
          <p className="mt-2 text-sm text-[#667085]">
            데이터베이스 연결 후 팀 추가, 수정, 순서 변경 기능을 연결합니다.
          </p>
        </div>
        <button
          form="create-team-form"
          className="inline-flex items-center gap-2 rounded bg-[#2457a7] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" aria-hidden />
          팀 추가
        </button>
      </div>

      <form
        id="create-team-form"
        action={createTeam}
        className="mt-6 flex gap-3 rounded border border-[#d6dbe1] bg-white p-4"
      >
        <label className="flex-1">
          <span className="mb-2 block text-sm font-semibold">새 팀명</span>
          <input
            name="name"
            placeholder="예: 기획팀"
            className="w-full rounded border border-[#d6dbe1] px-3 py-2"
            required
          />
        </label>
      </form>

      {error ? (
        <div className="mt-6 rounded border border-[#d6dbe1] bg-white p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[#2457a7]" aria-hidden />
          <h2 className="mt-4 font-semibold">팀 목록을 아직 불러올 수 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">{error}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="mt-6 rounded border border-[#d6dbe1] bg-white p-8 text-center">
          <Users className="mx-auto h-10 w-10 text-[#2457a7]" aria-hidden />
          <h2 className="mt-4 font-semibold">등록된 팀이 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            위 입력칸에 팀명을 넣고 팀 추가를 눌러 시작하세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded border border-[#d6dbe1] bg-white">
          <div className="grid grid-cols-[80px_1fr_130px_260px] border-b border-[#d6dbe1] bg-[#f7f8fa] px-4 py-3 text-sm font-semibold text-[#344054]">
            <span>순서</span>
            <span>팀명</span>
            <span>상태</span>
            <span>작업</span>
          </div>
          <div className="divide-y divide-[#d6dbe1]">
            {teams.map((team, index) => (
              <div
                key={team.id}
                className="grid grid-cols-[80px_1fr_130px_260px] items-center gap-3 px-4 py-3"
              >
                <span className="text-sm text-[#667085]">{index + 1}</span>
                <form action={updateTeamName} className="flex gap-2">
                  <input type="hidden" name="id" value={team.id} />
                  <input
                    name="name"
                    defaultValue={team.name}
                    className="w-full rounded border border-[#d6dbe1] px-3 py-2"
                    required
                  />
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#d6dbe1]"
                    title="팀명 저장"
                  >
                    <Save className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <span
                  className={
                    team.isActive
                      ? "text-sm font-semibold text-[#2457a7]"
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
                      className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
                      title="위로 이동"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={moveTeam}>
                    <input type="hidden" name="id" value={team.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
                      title="아래로 이동"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={toggleTeamActive}>
                    <input type="hidden" name="id" value={team.id} />
                    <input type="hidden" name="isActive" value={String(team.isActive)} />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
                      title={team.isActive ? "미사용 처리" : "사용 처리"}
                    >
                      <Power className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                  <form action={rotateTeamWriteToken}>
                    <input type="hidden" name="id" value={team.id} />
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
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
    </main>
  );
}
