import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/print-button";
import { ReportRichText } from "@/components/report-rich-text";

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

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-8 print:max-w-none print:px-0">
      <div className="no-print mb-6 flex items-center justify-between border-b border-[#d6dbe1] pb-4">
        <Link
          href="/admin/cycles"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2457a7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          회차 관리
        </Link>
        <PrintButton />
      </div>

      <article>
        <header className="border-b-2 border-[#171717] pb-5 text-center">
          <h1 className="text-3xl font-semibold">{cycle.title}</h1>
          <p className="mt-3 text-sm text-[#344054]">
            보고 기간: {formatDate(cycle.startDate)} ~ {formatDate(cycle.endDate)}
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {cycle.entries.map((entry) => (
            <section key={entry.id}>
              <div className="mb-3 flex items-center justify-between border-b border-[#171717] pb-2">
                <h2 className="text-xl font-semibold">{entry.team.name}</h2>
                <span className="text-sm text-[#344054]">{entryStatusLabel(entry.status)}</span>
              </div>
              {entry.workItems.length === 0 ? (
                <p className="mt-4 text-sm text-[#667085]">
                  {entry.status === "not_started" ? "작성 전" : "입력된 업무 항목 없음"}
                </p>
              ) : (
                <table className="w-full border-collapse text-sm leading-6">
                  <thead>
                    <tr>
                      <th className="w-1/2 border border-[#171717] bg-[#f7f8fa] px-3 py-2 text-center font-semibold">
                        지난 업무 실적
                      </th>
                      <th className="w-1/2 border border-[#171717] bg-[#f7f8fa] px-3 py-2 text-center font-semibold">
                        다음 주 계획
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.workItems.map((item) => (
                      <tr key={item.id} className="align-top">
                        <td className="border border-[#171717] px-3 py-3">
                          <ReportCell title={item.title} body={item.description} note={item.note} />
                        </td>
                        <td className="border border-[#171717] px-3 py-3">
                          <ReportCell title={item.title} body={item.nextPlan} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function ReportCell({
  title,
  body,
  note,
}: {
  title: string;
  body: string;
  note?: string | null;
}) {
  return (
    <div>
      <p className="font-semibold">■ {title || "업무명 없음"}</p>
      {body ? (
        <div className="mt-2">
          <ReportRichText text={body} />
        </div>
      ) : null}
      {note ? (
        <div className="mt-2 text-[#344054]">
          <p className="font-semibold">※ 비고</p>
          <ReportRichText text={note} />
        </div>
      ) : null}
    </div>
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
