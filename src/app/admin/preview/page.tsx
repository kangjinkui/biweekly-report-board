import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { ReportRichText } from "@/components/report-rich-text";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";
import { prisma } from "@/lib/prisma";

const sampleCycle = {
  startDate: new Date("2025-05-22T00:00:00.000Z"),
  endDate: new Date("2025-06-04T00:00:00.000Z"),
  previousStartDate: new Date("2025-05-22T00:00:00.000Z"),
  previousEndDate: new Date("2025-05-28T00:00:00.000Z"),
  currentStartDate: new Date("2025-05-29T00:00:00.000Z"),
  currentEndDate: new Date("2025-06-04T00:00:00.000Z"),
};

const sampleTeams = [
  {
    name: "샘플 기획팀",
    items: [
      {
        title: "업무보고 수합판 MVP 기획",
        description:
          "◦ PRD와 기술스펙 정리\n◦ 행정망 고정 IP 배포 전제 반영\n\n| 구분 | 완료 | 진행 중 |\n| --- | ---: | ---: |\n| 화면 | 3 | 2 |\n| 보안 | 2 | 1 |",
        nextPlan: "◦ 팀별 작성 화면 개선\n◦ 보고서 표형 미리보기 보완",
      },
    ],
  },
  {
    name: "운영팀",
    items: [],
  },
];

async function getLatestCycleId() {
  try {
    const cycle = await prisma.reportCycle.findFirst({
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      select: { id: true },
    });

    return cycle?.id ?? null;
  } catch {
    return null;
  }
}

export default async function PreviewPage() {
  const latestCycleId = await getLatestCycleId();

  if (latestCycleId) {
    redirect(`/admin/cycles/${latestCycleId}/preview`);
  }

  const periodSummary = formatCyclePeriodSummary(sampleCycle);

  return (
    <main className="gov-page py-6 print:bg-white print:py-0">
      <div className="no-print gov-container mb-4 flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#005bac]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          관리자 화면
        </Link>
        <PrintButton />
      </div>

      <article className="gov-panel mx-auto max-w-4xl bg-white px-8 py-8 print:max-w-none print:border-0 print:px-0">
        <header className="border-b-4 border-[#005bac] pb-5 text-center">
          <h1 className="text-3xl font-semibold">샘플 보고서 미리보기</h1>
          <p className="mt-3 text-sm text-[#344054]">
            {periodSummary.project}
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {sampleTeams.map((team) => (
            <section key={team.name}>
              <h2 className="border-b-2 border-[#005bac] bg-[#f6f9fc] px-4 py-3 text-xl font-semibold text-[#003f7d]">
                {team.name}
              </h2>
              {team.items.length === 0 ? (
                <p className="border border-t-0 border-[#c8d3df] px-4 py-4 text-sm text-[#667085]">
                  입력된 업무 항목 없음
                </p>
              ) : (
                <table className="gov-table w-full border-collapse text-sm leading-6">
                  <thead>
                    <tr>
                      <th className="w-1/2 border px-3 py-2 text-center">
                        {periodSummary.previous}
                      </th>
                      <th className="w-1/2 border px-3 py-2 text-center">
                        {periodSummary.current}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.items.map((item) => (
                      <tr key={item.title} className="align-top">
                        <td className="border px-3 py-3">
                          <p className="font-semibold">■ {item.title}</p>
                          <div className="mt-2">
                            <ReportRichText text={item.description} />
                          </div>
                        </td>
                        <td className="border px-3 py-3">
                          <p className="font-semibold">■ {item.title}</p>
                          <div className="mt-2">
                            <ReportRichText text={item.nextPlan} />
                          </div>
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
