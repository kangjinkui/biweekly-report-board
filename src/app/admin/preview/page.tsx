import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/print-button";
import { ReportRichText } from "@/components/report-rich-text";

const sampleTeams = [
  {
    name: "기획팀",
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

export default function PreviewPage() {
  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-8 print:max-w-none print:px-0">
      <div className="no-print mb-6 flex items-center justify-between border-b border-[#d6dbe1] pb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2457a7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          관리자 화면
        </Link>
        <PrintButton />
      </div>

      <article>
        <header className="border-b-2 border-[#171717] pb-5 text-center">
          <h1 className="text-3xl font-semibold">격주 업무보고</h1>
          <p className="mt-3 text-sm text-[#344054]">
            보고 기간: 2026-05-01 ~ 2026-05-14
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {sampleTeams.map((team) => (
            <section key={team.name}>
              <h2 className="border-b border-[#d6dbe1] pb-2 text-xl font-semibold">
                {team.name}
              </h2>
              {team.items.length === 0 ? (
                <p className="mt-4 text-sm text-[#667085]">입력된 업무 항목 없음</p>
              ) : (
                <table className="mt-4 w-full border-collapse text-sm leading-6">
                  <thead>
                    <tr>
                      <th className="w-1/2 border border-[#171717] bg-[#f7f8fa] px-3 py-2 text-center">
                        지난 업무 실적
                      </th>
                      <th className="w-1/2 border border-[#171717] bg-[#f7f8fa] px-3 py-2 text-center">
                        다음 주 계획
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.items.map((item) => (
                      <tr key={item.title} className="align-top">
                        <td className="border border-[#171717] px-3 py-3">
                          <p className="font-semibold">■ {item.title}</p>
                          <div className="mt-2">
                            <ReportRichText text={item.description} />
                          </div>
                        </td>
                        <td className="border border-[#171717] px-3 py-3">
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
