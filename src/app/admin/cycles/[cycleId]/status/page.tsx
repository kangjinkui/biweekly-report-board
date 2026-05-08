import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateEntryStatus } from "./actions";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";
import { PageShell } from "@/components/page-shell";

type StatusPageProps = {
  params: Promise<{
    cycleId: string;
  }>;
};

const statuses = [
  ["not_started", "작성 전"],
  ["in_progress", "작성 중"],
  ["submitted", "제출 완료"],
  ["needs_revision", "수정 필요"],
  ["completed", "완료"],
] as const;

export default async function StatusPage({ params }: StatusPageProps) {
  const { cycleId } = await params;
  const cycle = await prisma.reportCycle.findUnique({
    where: { id: cycleId },
    include: {
      entries: {
        orderBy: {
          team: { displayOrder: "asc" },
        },
        include: {
          team: true,
          workItems: {
            select: { id: true },
          },
        },
      },
    },
  });

  if (!cycle) notFound();

  const submittedCount = cycle.entries.filter((entry) =>
    ["submitted", "completed"].includes(entry.status),
  ).length;
  const periodSummary = formatCyclePeriodSummary(cycle);

  return (
    <PageShell
      title="수합 현황판"
      description={`${cycle.title} · ${periodSummary.project}`}
      actions={
        <>
          <Link
            href="/admin/cycles"
            className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            회차 관리
          </Link>
          <div className="border border-[#7db5e5] bg-white/10 px-4 py-3 text-sm font-semibold">
          제출 {submittedCount}/{cycle.entries.length}
          </div>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="gov-section-title text-xl">팀별 제출 상태</h2>
      </div>

      <div className="gov-panel overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_110px_170px_270px] border-b border-[#8fa9c1] bg-[#e8f1fa] px-4 py-3 text-sm font-semibold text-[#102a43]">
          <span>팀명</span>
          <span>상태</span>
          <span>보고 항목</span>
          <span>최종 수정</span>
          <span>작업</span>
        </div>
        <div className="divide-y divide-[#c8d3df]">
          {cycle.entries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-[1fr_120px_110px_170px_270px] items-center gap-3 px-4 py-3 text-sm"
            >
              <span className="font-semibold">{entry.team.name}</span>
              <span>{entryStatusLabel(entry.status)}</span>
              <span>{entry.workItems.length}</span>
              <span className="text-[#667085]">{formatDateTime(entry.updatedAt)}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/write/${entry.teamId}/${cycle.id}`}
                  className="inline-flex h-9 w-9 items-center justify-center border border-[#8db8dd] text-[#005bac]"
                  title="작성 화면"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
                <form action={updateEntryStatus} className="flex flex-1 gap-2">
                  <input type="hidden" name="cycleId" value={cycle.id} />
                  <input type="hidden" name="entryId" value={entry.id} />
                  <select
                    name="status"
                    defaultValue={entry.status}
                    className="w-full border border-[#c8d3df] px-2 py-2"
                    aria-label={`${entry.team.name} 상태 변경`}
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center border border-[#8db8dd] text-[#005bac]"
                    title="상태 저장"
                  >
                    <Save className="h-4 w-4" aria-hidden />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm text-[#667085]">상태를 바꾼 뒤 저장 버튼을 누르세요.</p>
    </PageShell>
  );
}

function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
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
