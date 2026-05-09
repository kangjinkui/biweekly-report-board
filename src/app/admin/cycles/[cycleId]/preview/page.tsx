import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";
import { ReportTwoColumnTable } from "@/components/report-two-column-table";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";

type PreviewPageProps = {
  params: Promise<{
    cycleId: string;
  }>;
};

export default async function CyclePreviewPage({ params }: PreviewPageProps) {
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
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });

  if (!cycle) notFound();

  const periodSummary = formatCyclePeriodSummary(cycle);

  return (
    <main className="gov-page py-6 print:bg-white print:py-0">
      <div className="no-print gov-container mb-4 flex items-center justify-between">
        <Link
          href="/admin/cycles"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#005bac]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          회차 관리
        </Link>
        <PrintButton />
      </div>

      <article className="gov-panel mx-auto max-w-4xl bg-white px-8 py-8 print:max-w-none print:border-0 print:px-0">
        <header className="border-b-4 border-[#005bac] pb-5 text-center">
          <h1 className="text-3xl font-semibold">{cycle.title}</h1>
          <p className="mt-3 text-sm text-[#344054]">
            {periodSummary.project}
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {cycle.entries.map((entry) => (
            <section key={entry.id}>
              <div className="flex items-center justify-between border-b-2 border-[#005bac] bg-[#f6f9fc] px-4 py-3">
                <h2 className="text-xl font-semibold text-[#003f7d]">{entry.team.name}</h2>
                <span className="border border-[#c8d3df] bg-white px-3 py-1 text-sm text-[#344054]">{entryStatusLabel(entry.status)}</span>
              </div>
              {entry.workItems.length === 0 ? (
                <p className="border border-t-0 border-[#c8d3df] px-4 py-4 text-sm text-[#667085]">
                  {entry.status === "not_started" ? "작성 전" : "입력된 업무 항목 없음"}
                </p>
              ) : (
                <ReportTwoColumnTable
                  items={entry.workItems}
                  previousLabel={periodSummary.previous}
                  currentLabel={periodSummary.current}
                />
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
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
