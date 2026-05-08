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
import { formatCyclePeriodSummary, formatKoreanDate } from "@/lib/report-cycle";
import { PageShell } from "@/components/page-shell";

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
  const periodSummary = formatCyclePeriodSummary(cycle);

  return (
    <PageShell
      eyebrow={`${team.name} 작성 화면`}
      title={cycle.title}
      description={`${periodSummary.project} / ${periodSummary.previous} / ${periodSummary.current} / 마감일 ${formatKoreanDate(cycle.dueDate)}`}
      maxWidth="max-w-5xl"
      actions={
        <div className="border border-[#7db5e5] bg-white/10 px-4 py-3 text-sm">
          <span className="text-[#d7ecff]">상태</span>
          <span className="ml-2 font-semibold text-white">
            {entryStatusLabel(entry.status)}
          </span>
        </div>
      }
    >
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#005bac]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        관리자 화면
      </Link>

      <section className="mt-6 flex flex-wrap gap-3">
        <form action={addWorkItem}>
          <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
          <button className="gov-action inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold">
            <Plus className="h-4 w-4" aria-hidden />
            보고 항목 추가
          </button>
        </form>

        <form action={copyPreviousEntry}>
          <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
          <button className="gov-subtle-action inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold">
            <ClipboardCopy className="h-4 w-4" aria-hidden />
            지난 회차 복사
          </button>
        </form>

        <form action={submitEntry}>
          <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
          <button
            className="inline-flex items-center gap-2 border border-[#005bac] bg-white px-4 py-2 text-sm font-semibold text-[#005bac] disabled:cursor-not-allowed disabled:border-[#c8d3df] disabled:text-[#667085]"
            disabled={entry.workItems.length === 0}
          >
            <Send className="h-4 w-4" aria-hidden />
            제출
          </button>
        </form>
      </section>

      {isSubmitted ? (
        <div className="gov-panel mt-4 p-4 text-sm text-[#344054]">
          제출 완료 상태입니다. 내용을 수정하면 작성 중 상태로 돌아갑니다.
        </div>
      ) : null}

      {entry.workItems.length === 0 ? (
        <div className="gov-panel mt-6 p-8 text-center">
          <h2 className="font-semibold">입력된 업무 항목이 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            보고 항목 추가를 눌러 지난 업무 실적과 다음 주 계획을 작성하세요.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {entry.workItems.map((item, index) => (
            <section key={item.id} className="gov-panel p-4">
              <WorkItemEditor
                item={item}
                entryId={entry.id}
                teamId={team.id}
                cycleId={cycle.id}
                index={index}
                previousPeriodLabel={periodSummary.previous}
                currentPeriodLabel={periodSummary.current}
              />

              <div className="mt-4 flex gap-2 border-t border-[#c8d3df] pt-4">
                <form action={moveWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]" title="위로 이동">
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <form action={moveWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]" title="아래로 이동">
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <form action={deleteWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df] text-[#b42318]" title="삭제">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </form>
              </div>
            </section>
          ))}
        </div>
      )}
    </PageShell>
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
