import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarPlus, FileText, KeyRound, RotateCcw, Save } from "lucide-react";
import {
  createCycle,
  rotateShareToken,
  toggleCycleStatus,
  updateCycle,
} from "./actions";
import { prisma } from "@/lib/prisma";

async function getCycles() {
  try {
    return {
      cycles: await prisma.reportCycle.findMany({
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        include: {
          entries: {
            orderBy: {
              team: { displayOrder: "asc" },
            },
            include: {
              team: true,
            },
          },
        },
      }),
      error: null,
    };
  } catch {
    return {
      cycles: [],
      error: "DB 연결 또는 마이그레이션 적용이 필요합니다.",
    };
  }
}

export default async function CyclesPage() {
  const { cycles, error } = await getCycles();

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
          <h1 className="text-2xl font-semibold">회차 관리</h1>
          <p className="mt-2 text-sm text-[#667085]">
            보고 제목, 기간, 작성 마감일을 관리하는 화면입니다.
          </p>
        </div>
        <button
          form="create-cycle-form"
          className="inline-flex items-center gap-2 rounded bg-[#2457a7] px-4 py-2 text-sm font-semibold text-white"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          회차 생성
        </button>
      </div>

      <form
        id="create-cycle-form"
        action={createCycle}
        className="mt-6 grid gap-4 rounded border border-[#d6dbe1] bg-white p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]"
      >
        <label>
          <span className="mb-2 block text-sm font-semibold">보고 제목</span>
          <input
            name="title"
            placeholder="예: 2026년 5월 1차 업무보고"
            className="w-full rounded border border-[#d6dbe1] px-3 py-2"
            required
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">시작일</span>
          <input
            type="date"
            name="startDate"
            className="w-full rounded border border-[#d6dbe1] px-3 py-2"
            required
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">종료일</span>
          <input
            type="date"
            name="endDate"
            className="w-full rounded border border-[#d6dbe1] px-3 py-2"
            required
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold">마감일</span>
          <input
            type="date"
            name="dueDate"
            className="w-full rounded border border-[#d6dbe1] px-3 py-2"
            required
          />
        </label>
      </form>

      {error ? (
        <div className="mt-6 rounded border border-[#d6dbe1] bg-white p-8">
          <h2 className="font-semibold">회차 목록을 아직 불러올 수 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">{error}</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="mt-6 rounded border border-[#d6dbe1] bg-white p-8">
          <h2 className="font-semibold">등록된 회차가 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            첫 회차를 만들면 활성 팀 기준으로 보고 엔트리가 함께 생성됩니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {cycles.map((cycle) => (
            <section
              key={cycle.id}
              className="rounded border border-[#d6dbe1] bg-white p-4"
            >
              <form
                action={updateCycle}
                className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
              >
                <input type="hidden" name="id" value={cycle.id} />
                <label>
                  <span className="mb-2 block text-sm font-semibold">보고 제목</span>
                  <input
                    name="title"
                    defaultValue={cycle.title}
                    className="w-full rounded border border-[#d6dbe1] px-3 py-2"
                    required
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">시작일</span>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={formatDateInput(cycle.startDate)}
                    className="w-full rounded border border-[#d6dbe1] px-3 py-2"
                    required
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">종료일</span>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={formatDateInput(cycle.endDate)}
                    className="w-full rounded border border-[#d6dbe1] px-3 py-2"
                    required
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-semibold">마감일</span>
                  <input
                    type="date"
                    name="dueDate"
                    defaultValue={formatDateInput(cycle.dueDate)}
                    className="w-full rounded border border-[#d6dbe1] px-3 py-2"
                    required
                  />
                </label>
                <button
                  className="mt-7 inline-flex h-10 w-10 items-center justify-center rounded border border-[#d6dbe1]"
                  title="회차 저장"
                >
                  <Save className="h-4 w-4" aria-hidden />
                </button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#d6dbe1] pt-4">
                <div className="text-sm text-[#667085]">
                  상태:{" "}
                  <span className="font-semibold text-[#171717]">
                    {cycle.status === "draft" ? "작성 중" : "완료"}
                  </span>
                  <span className="mx-2">·</span>
                  팀별 보고 엔트리 {cycle.entries.length}개
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/cycles/${cycle.id}/status`}
                    className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm"
                  >
                    <BarChart3 className="h-4 w-4" aria-hidden />
                    현황
                  </Link>
                  <Link
                    href={`/admin/cycles/${cycle.id}/preview`}
                    className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    미리보기
                  </Link>
                  <form action={toggleCycleStatus}>
                    <input type="hidden" name="id" value={cycle.id} />
                    <input type="hidden" name="status" value={cycle.status} />
                    <button className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm">
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      상태 전환
                    </button>
                  </form>
                  <form action={rotateShareToken}>
                    <input type="hidden" name="id" value={cycle.id} />
                    <button className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm">
                      <KeyRound className="h-4 w-4" aria-hidden />
                      공유 링크 재발급
                    </button>
                  </form>
                </div>
              </div>

              {cycle.entries.length > 0 ? (
                <div className="mt-4 border-t border-[#d6dbe1] pt-4">
                  <h3 className="text-sm font-semibold">팀별 작성 링크</h3>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {cycle.entries.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/write/${entry.teamId}/${cycle.id}`}
                        className="flex items-center justify-between rounded border border-[#d6dbe1] px-3 py-2 text-sm hover:border-[#2457a7]"
                      >
                        <span>{entry.team.name}</span>
                        <span className="text-[#667085]">
                          {entryStatusLabel(entry.status)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function entryStatusLabel(status: string) {
  const labels: Record<string, string> = {
    not_started: "작성 전",
    in_progress: "작성 중",
    submitted: "제출 완료",
    needs_revision: "수정 필요",
    completed: "완료",
  };

  return labels[status] ?? status;
}
