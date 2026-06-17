import Link from "next/link";
import { ArrowLeft, BarChart3, ExternalLink, FileText } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { prisma } from "@/lib/prisma";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";
import { ensureDraftCycleEntriesForActiveTeams } from "@/lib/report-entries";
import { CycleAdminTabs } from "../cycle-admin-tabs";
import { requireAdminUser, type CurrentUser } from "@/lib/auth";
import { compareReportEntriesByDepartmentOrder } from "@/lib/organization";

export const dynamic = "force-dynamic";

async function getCyclesWithLinks(user: CurrentUser) {
  try {
    await ensureDraftCycleEntriesForActiveTeams();
    const entryWhere =
      user.role === "super_admin"
        ? undefined
        : { team: { departmentName: user.managedDepartmentName ?? "" } };

    return {
      cycles: await prisma.reportCycle.findMany({
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        include: {
          entries: {
            where: entryWhere,
            orderBy: [
              { team: { departmentName: "asc" } },
              { team: { displayOrder: "asc" } },
              { team: { name: "asc" } },
            ],
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

export default async function CycleLinksPage() {
  const user = await requireAdminUser();
  const { cycles, error } = await getCyclesWithLinks(user);

  return (
    <PageShell
      title="회차 관리"
      description="팀별 작성 화면으로 바로 전달할 링크를 회차별로 확인합니다."
      maxWidth="max-w-6xl"
      actions={
        <>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            관리자 화면
          </Link>
          <Link
            href="/admin/cycles"
            className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-semibold text-[#003f7d]"
          >
            <FileText className="h-4 w-4" aria-hidden />
            회차 설정
          </Link>
        </>
      }
    >
      <CycleAdminTabs active="links" />

      {error ? (
        <div className="gov-panel p-8">
          <h2 className="font-semibold">작성 링크를 아직 불러올 수 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">{error}</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="gov-panel p-8">
          <h2 className="font-semibold">등록된 회차가 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            회차를 만들면 활성 팀 기준으로 작성 링크가 생성됩니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {cycles.map((cycle) => {
            const entries = [...cycle.entries].sort(compareReportEntriesByDepartmentOrder);

            return (
            <section key={cycle.id} className="gov-panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8d3df] bg-[#f6f9fc] px-4 py-3">
                <div>
                  <h2 className="font-semibold text-[#102a43]">{cycle.title}</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    {formatCyclePeriodSummary(cycle).project}
                    <span className="mx-2">·</span>
                    {cycle.status === "draft" ? "작성 중" : "완료"}
                    <span className="mx-2">·</span>
                    작성 링크 {entries.length}개
                  </p>
                </div>
                <Link
                  href={`/admin/cycles/${cycle.id}/status`}
                  className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm"
                >
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  현황
                </Link>
              </div>

              {entries.length === 0 ? (
                <div className="px-4 py-6 text-sm text-[#667085]">
                  작성 링크가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-[#c8d3df]">
                  {entries.map((entry) => {
                    const writePath = `/write/${entry.teamId}/${cycle.id}`;
                    const writeUrl = makeAbsoluteUrl(writePath);

                    return (
                      <div
                        key={entry.id}
                        className="grid gap-3 px-4 py-3 md:grid-cols-[180px_1fr_110px_auto] md:items-center"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#102a43]">
                            {entry.team.name}
                          </p>
                          <p className="mt-1 text-xs text-[#667085]">
                            {entry.team.departmentName}
                          </p>
                        </div>
                        <code className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-[#d6dbe1] bg-white px-3 py-2 text-xs text-[#344054]">
                          {writeUrl}
                        </code>
                        <span className="text-sm font-semibold text-[#005bac]">
                          {entryStatusLabel(entry.status)}
                        </span>
                        <Link
                          href={writePath}
                          target="_blank"
                          className="gov-action inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          열기
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function makeAbsoluteUrl(path: string) {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
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
