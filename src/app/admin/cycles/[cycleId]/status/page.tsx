import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateEntryStatus } from "./actions";

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <Link
        href="/admin/cycles"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#2457a7]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        회차 관리
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-[#d6dbe1] pb-5">
        <div>
          <h1 className="text-2xl font-semibold">수합 현황판</h1>
          <p className="mt-2 text-sm text-[#667085]">
            {cycle.title} · {formatDate(cycle.startDate)} ~ {formatDate(cycle.endDate)}
          </p>
        </div>
        <div className="rounded border border-[#d6dbe1] bg-white px-4 py-3 text-sm">
          제출 {submittedCount}/{cycle.entries.length}
        </div>
      </header>

      <div className="mt-6 overflow-hidden rounded border border-[#d6dbe1] bg-white">
        <div className="grid grid-cols-[1fr_120px_110px_170px_270px] border-b border-[#d6dbe1] bg-[#f7f8fa] px-4 py-3 text-sm font-semibold text-[#344054]">
          <span>팀명</span>
          <span>상태</span>
          <span>보고 항목</span>
          <span>최종 수정</span>
          <span>작업</span>
        </div>
        <div className="divide-y divide-[#d6dbe1]">
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
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
                    className="w-full rounded border border-[#d6dbe1] px-2 py-2"
                    aria-label={`${entry.team.name} 상태 변경`}
                  >
                    {statuses.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
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
    </main>
  );
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
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
