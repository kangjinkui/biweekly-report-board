import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ClipboardCopy,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  addWorkItem,
  copyPreviousEntry,
  deleteWorkItem,
  moveWorkItem,
  submitEntry,
} from "./actions";
import { WorkItemEditor } from "./work-item-editor";

type WritePageProps = {
  params: Promise<{
    teamId: string;
    cycleId: string;
  }>;
};

export default async function WritePage({ params }: WritePageProps) {
  const { teamId, cycleId } = await params;
  const data = await getWriteData(teamId, cycleId);

  if (!data) {
    notFound();
  }

  const { team, cycle, entry } = data;
  const isSubmitted = entry.status === "submitted";

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#2457a7]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        관리자 화면
      </Link>

      <header className="mt-6 border-b border-[#d6dbe1] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#2457a7]">{team.name}</p>
            <h1 className="mt-2 text-2xl font-semibold">{cycle.title}</h1>
            <p className="mt-2 text-sm text-[#667085]">
              {formatDate(cycle.startDate)} ~ {formatDate(cycle.endDate)}
              <span className="mx-2">·</span>
              마감일 {formatDate(cycle.dueDate)}
            </p>
          </div>
          <div className="rounded border border-[#d6dbe1] bg-white px-4 py-3 text-sm">
            <span className="text-[#667085]">상태</span>
            <span className="ml-2 font-semibold text-[#171717]">
              {entryStatusLabel(entry.status)}
            </span>
          </div>
        </div>
      </header>

      <section className="mt-6 flex flex-wrap gap-3">
        <form action={addWorkItem}>
          <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
          <button className="inline-flex items-center gap-2 rounded bg-[#2457a7] px-4 py-2 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" aria-hidden />
            보고 항목 추가
          </button>
        </form>

        <form action={copyPreviousEntry}>
          <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
          <button className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] bg-white px-4 py-2 text-sm font-semibold">
            <ClipboardCopy className="h-4 w-4" aria-hidden />
            지난 회차 복사
          </button>
        </form>

        <form action={submitEntry}>
          <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
          <button
            className="inline-flex items-center gap-2 rounded border border-[#2457a7] bg-white px-4 py-2 text-sm font-semibold text-[#2457a7] disabled:cursor-not-allowed disabled:border-[#d6dbe1] disabled:text-[#667085]"
            disabled={entry.workItems.length === 0}
          >
            <Send className="h-4 w-4" aria-hidden />
            제출
          </button>
        </form>
      </section>

      {isSubmitted ? (
        <div className="mt-4 rounded border border-[#d6dbe1] bg-white p-4 text-sm text-[#344054]">
          제출 완료 상태입니다. 내용을 수정하면 작성 중 상태로 돌아갑니다.
        </div>
      ) : null}

      {entry.workItems.length === 0 ? (
        <div className="mt-6 rounded border border-[#d6dbe1] bg-white p-8 text-center">
          <h2 className="font-semibold">입력된 업무 항목이 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            보고 항목 추가를 눌러 지난 업무 실적과 다음 주 계획을 작성하세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {entry.workItems.map((item, index) => (
            <section key={item.id} className="rounded border border-[#d6dbe1] bg-white p-4">
              <WorkItemEditor
                item={item}
                entryId={entry.id}
                teamId={team.id}
                cycleId={cycle.id}
                index={index}
              />

              <div className="mt-4 flex gap-2 border-t border-[#d6dbe1] pt-4">
                <form action={moveWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]" title="위로 이동">
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <form action={moveWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]" title="아래로 이동">
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <form action={deleteWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1] text-[#b42318]" title="삭제">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </form>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

async function getWriteData(teamId: string, cycleId: string) {
  const [team, cycle] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.reportCycle.findUnique({ where: { id: cycleId } }),
  ]);

  if (!team || !cycle || !team.isActive) {
    return null;
  }

  const entry = await prisma.reportEntry.upsert({
    where: {
      reportCycleId_teamId: {
        reportCycleId: cycleId,
        teamId,
      },
    },
    update: {},
    create: {
      reportCycleId: cycleId,
      teamId,
    },
    include: {
      workItems: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return { team, cycle, entry };
}

function HiddenContext({
  entryId,
  teamId,
  cycleId,
}: {
  entryId: string;
  teamId: string;
  cycleId: string;
}) {
  return (
    <>
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="cycleId" value={cycleId} />
    </>
  );
}

function formatDate(date: Date) {
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
