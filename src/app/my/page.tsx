import Link from "next/link";
import { LogOut, PencilLine } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { BadgeBoard, ReportLevelCard, TeamGaugeCard } from "@/components/gamification-widgets";
import { canWriteTeam, requireCurrentUser, statusLabel } from "@/lib/auth";
import { buildReportLevelProfile, buildTeamGauge } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";

export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await requireCurrentUser();
  const [entries, latestDepartmentCycle] = user.teamId
    ? await Promise.all([
        prisma.reportEntry.findMany({
          where: { teamId: user.teamId },
          orderBy: [{ cycle: { startDate: "desc" } }, { createdAt: "desc" }],
          include: {
            cycle: true,
            workItems: { select: { id: true } },
          },
        }),
        prisma.reportCycle.findFirst({
          orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
          include: {
            entries: {
              where: { team: { departmentName: user.team?.departmentName ?? "" } },
              select: { status: true },
            },
          },
        }),
      ])
    : [[], null];
  const levelProfile = buildReportLevelProfile(entries);
  const teamGauge = latestDepartmentCycle
    ? buildTeamGauge(latestDepartmentCycle.entries)
    : null;

  return (
    <PageShell
      title="내 업무보고"
      description={`${user.name || user.email} / ${user.team?.departmentName ?? "소속 과 없음"} / ${user.team?.name ?? "팀 없음"}`}
      actions={
        <form action="/logout" method="post">
          <button className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold">
          <LogOut className="h-4 w-4" aria-hidden />
          로그아웃
          </button>
        </form>
      }
    >
      <ReportLevelCard profile={levelProfile} />
      <BadgeBoard badges={levelProfile.badges} />
      {teamGauge ? (
        <div className="mb-5">
          <TeamGaugeCard gauge={teamGauge} title="우리 부서 제출 게이지" />
        </div>
      ) : null}

      <section className="gov-panel mb-5 p-4">
        <p className="text-sm text-[#667085]">계정 상태</p>
        <p className="mt-1 text-xl font-semibold">{statusLabel(user.status)}</p>
        {user.status !== "approved" ? (
          <p className="mt-2 text-sm text-[#667085]">
            승인 전에는 보고서 작성과 제출이 제한됩니다.
          </p>
        ) : null}
      </section>

      <div className="grid gap-3">
        {entries.map((entry) => {
          const canWrite = canWriteTeam(user, entry.teamId);
          return (
            <section key={entry.id} className="gov-panel flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <h2 className="font-semibold">{entry.cycle.title}</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  {formatCyclePeriodSummary(entry.cycle).project}
                  <span className="mx-2">·</span>
                  {entryStatusLabel(entry.status)}
                  <span className="mx-2">·</span>
                  항목 {entry.workItems.length}개
                </p>
              </div>
              {canWrite ? (
                <Link
                  href={`/write/${entry.teamId}/${entry.reportCycleId}`}
                  prefetch={false}
                  className="gov-action inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <PencilLine className="h-4 w-4" aria-hidden />
                  작성
                </Link>
              ) : (
                <span className="border border-[#c8d3df] px-4 py-2 text-sm font-semibold text-[#667085]">
                  승인 대기
                </span>
              )}
            </section>
          );
        })}
      </div>
    </PageShell>
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
