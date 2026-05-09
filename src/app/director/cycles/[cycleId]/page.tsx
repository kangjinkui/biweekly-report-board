import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDashed } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { ReportTwoColumnTable } from "@/components/report-two-column-table";
import { PageShell } from "@/components/page-shell";
import { BUREAU_NAME, DEPARTMENT_NAMES } from "@/lib/organization";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";
import { prisma } from "@/lib/prisma";

type DirectorReportPageProps = {
  params: Promise<{
    cycleId: string;
  }>;
};

export default async function DirectorReportPage({ params }: DirectorReportPageProps) {
  const { cycleId } = await params;
  const cycle = await prisma.reportCycle.findUnique({
    where: { id: cycleId },
    include: {
      entries: {
        orderBy: [
          { team: { departmentName: "asc" } },
          { team: { displayOrder: "asc" } },
        ],
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
  const submittedEntries = cycle.entries.filter((entry) =>
    ["submitted", "completed"].includes(entry.status),
  );

  return (
    <PageShell
      eyebrow={`${BUREAU_NAME}장 보고`}
      title={cycle.title}
      description={`${periodSummary.project} / ${periodSummary.previous} / ${periodSummary.current}`}
      maxWidth="max-w-6xl"
      actions={
        <div className="no-print flex flex-wrap items-center gap-2">
          <Link
            href="/admin/cycles"
            className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            회차 관리
          </Link>
          <span className="border border-[#7db5e5] bg-white/10 px-3 py-2 text-sm font-semibold">
            제출 {submittedEntries.length}/{cycle.entries.length}
          </span>
          <PrintButton />
        </div>
      }
    >
      <article className="gov-panel p-5 print:border-0 print:p-0 print:shadow-none">
        <section className="mt-6 grid gap-3 md:grid-cols-3">
          <SummaryBox label="대상 과" value={`${DEPARTMENT_NAMES.length}개`} />
          <SummaryBox label="수합 팀" value={`${cycle.entries.length}개`} />
          <SummaryBox label="제출 완료" value={`${submittedEntries.length}개`} />
        </section>

        <div className="mt-8 space-y-8">
          {DEPARTMENT_NAMES.map((departmentName) => {
            const departmentEntries = cycle.entries.filter(
              (entry) => entry.team.departmentName === departmentName,
            );
            const departmentSubmittedCount = departmentEntries.filter((entry) =>
              ["submitted", "completed"].includes(entry.status),
            ).length;

            return (
              <section key={departmentName}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#005bac] bg-[#f6f9fc] px-4 py-3">
                  <h2 className="text-xl font-bold text-[#003f7d]">{departmentName}</h2>
                  <span className="border border-[#c8d3df] bg-white px-3 py-1 text-sm text-[#334155]">
                    제출 {departmentSubmittedCount}/{departmentEntries.length}
                  </span>
                </div>

                {departmentEntries.length === 0 ? (
                  <p className="border border-t-0 border-[#c8d3df] bg-white px-4 py-4 text-sm text-[#667085]">
                    이 회차에 연결된 팀 보고가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-4 border border-t-0 border-[#c8d3df] bg-white p-4">
                    {departmentEntries.map((entry) => (
                      <section
                        key={entry.id}
                        className="border border-[#aebfd0] bg-white"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8d3df] bg-[#eef5fb] px-4 py-3">
                          <div>
                            <h3 className="font-semibold">{entry.team.name}</h3>
                            <p className="mt-1 text-sm text-[#667085]">
                              보고 항목 {entry.workItems.length}개
                            </p>
                          </div>
                          <StatusPill status={entry.status} />
                        </div>
                        {entry.workItems.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-[#667085]">
                            입력된 업무 항목이 없습니다.
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
                )}
              </section>
            );
          })}
        </div>
      </article>
    </PageShell>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="gov-kpi border border-[#c8d3df] px-4 py-3">
      <p className="text-sm text-[#667085]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const isSubmitted = ["submitted", "completed"].includes(status);
  const Icon = isSubmitted ? CheckCircle2 : CircleDashed;

  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1 text-sm font-semibold ${
        isSubmitted
          ? "border-[#005bac] bg-white text-[#005bac]"
          : "border-[#c8d3df] bg-white text-[#667085]"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {entryStatusLabel(status)}
    </span>
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
