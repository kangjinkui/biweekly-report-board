import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  LinkIcon,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/page-shell";
import { CopyLinkButton } from "@/components/copy-link-button";
import { TeamGaugeCard } from "@/components/gamification-widgets";
import { requireAdminUser, type CurrentUser } from "@/lib/auth";
import { buildTeamGauge } from "@/lib/gamification";
import { compareReportEntriesByDepartmentOrder } from "@/lib/organization";
import { ensureDraftCycleEntriesForActiveTeams } from "@/lib/report-entries";

export const dynamic = "force-dynamic";

const managementItems = [
  {
    label: "팀 관리",
    description: "보고에 참여하는 팀 목록과 표시 순서를 관리합니다.",
    href: "/admin/teams",
    icon: Users,
  },
  {
    label: "회차 관리",
    description: "보고 제목, 기간, 마감일, 완료 상태를 관리합니다.",
    href: "/admin/cycles",
    icon: CalendarDays,
  },
  {
    label: "사용자 관리",
    description: "가입 대기 승인과 사용자 역할을 관리합니다.",
    href: "/admin/users",
    icon: UserCog,
  },
];

async function getDashboardData(user: CurrentUser) {
  const teamWhere =
    user.role === "super_admin"
      ? { isActive: true }
      : { isActive: true, departmentName: user.managedDepartmentName ?? "" };
  const entryWhere =
    user.role === "super_admin"
      ? undefined
      : { team: { departmentName: user.managedDepartmentName ?? "" } };

  try {
    await ensureDraftCycleEntriesForActiveTeams();

    const [activeTeams, latestCycle] = await Promise.all([
      prisma.team.count({ where: teamWhere }),
      prisma.reportCycle.findFirst({
        orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
        include: {
          entries: {
            where: entryWhere,
            include: {
              team: true,
              workItems: {
                select: { id: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      activeTeams,
      latestCycle,
      error: null,
    };
  } catch {
    return {
      activeTeams: 0,
      latestCycle: null,
      error: "DB 연결 또는 마이그레이션 적용이 필요합니다.",
    };
  }
}

export default async function AdminPage() {
  const user = await requireAdminUser();
  const dashboard = await getDashboardData(user);
  const latestCycle = dashboard.latestCycle;
  const entries = latestCycle
    ? [...latestCycle.entries].sort(compareReportEntriesByDepartmentOrder)
    : [];
  const submittedCount = entries.filter((entry) =>
    ["submitted", "completed"].includes(entry.status),
  ).length;
  const totalEntries = entries.length;
  const latestGauge = buildTeamGauge(entries);

  return (
    <PageShell
      title="격주 업무보고 수합판"
      description="팀별 보고 입력, 과별 수합, 국장 보고 화면을 한곳에서 관리합니다."
      actions={
        <>
          <div className="flex items-center gap-2 border border-[#7db5e5] bg-white/10 px-3 py-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            행정망 접근 전제
          </div>
          <form action="/logout" method="post">
            <button className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold">
              <LogOut className="h-4 w-4" aria-hidden />
              로그아웃
            </button>
          </form>
        </>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="gov-kpi gov-panel p-4">
          <p className="text-sm text-[#667085]">활성 팀</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.activeTeams}</p>
        </div>
        <div className="gov-kpi gov-panel p-4">
          <p className="text-sm text-[#667085]">현재 회차</p>
          <p className="mt-2 truncate text-lg font-semibold">
            {latestCycle?.title ?? "회차 없음"}
          </p>
        </div>
        <div className="gov-kpi gov-panel p-4">
          <p className="text-sm text-[#667085]">제출 현황</p>
          <p className="mt-2 text-2xl font-semibold">
            {submittedCount}/{totalEntries}
          </p>
        </div>
      </div>

      {latestCycle ? (
        <div className="mt-4">
          <TeamGaugeCard gauge={latestGauge} title="현재 회차 팀 제출 게이지" />
        </div>
      ) : null}

      {dashboard.error ? (
        <div className="gov-panel mt-4 p-4 text-sm text-[#667085]">
          {dashboard.error}
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="gov-section-title text-xl">관리 메뉴</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {managementItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="gov-panel group flex min-h-32 flex-col justify-between p-4 transition hover:border-[#005bac]"
              >
                <span className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#e7f1fb]">
                    <Icon className="h-5 w-5 text-[#005bac]" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#667085]">
                      {item.description}
                    </span>
                  </span>
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#005bac] group-hover:underline">
                  <LinkIcon className="h-4 w-4" aria-hidden />
                  열기
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="gov-panel mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8d3df] pb-4">
          <div>
            <h2 className="gov-section-title text-xl">현재 회차 빠른 작업</h2>
            <p className="mt-1 text-sm text-[#667085]">
              작성 링크 전달과 보고서 확인을 이 화면에서 바로 처리합니다.
            </p>
          </div>
          {latestCycle ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/admin/cycles/${latestCycle.id}/preview`}
                className="gov-action inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              >
                <FileText className="h-4 w-4" aria-hidden />
                보고서 미리보기
              </Link>
              <Link
                href={`/admin/cycles/${latestCycle.id}/status`}
                className="gov-subtle-action inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                제출 현황
              </Link>
            </div>
          ) : (
            <Link
              href="/admin/cycles"
              className="gov-action inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
            >
              <CalendarDays className="h-4 w-4" aria-hidden />
              회차 생성
            </Link>
          )}
        </div>

        {!latestCycle ? (
          <div className="mt-5 border border-[#c8d3df] bg-[#f6f9fc] p-5 text-sm text-[#667085]">
            회차를 만들면 팀별 작성 링크와 보고서 미리보기가 이곳에 표시됩니다.
          </div>
        ) : (
          <div className="mt-5 overflow-hidden border border-[#c8d3df]">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-[#c8d3df] bg-[#f6f9fc] px-4 py-3 md:grid-cols-[180px_1fr_110px_180px]">
              <span className="text-sm font-semibold text-[#344054]">팀</span>
              <span className="hidden text-sm font-semibold text-[#344054] md:block">
                작성 링크
              </span>
              <span className="hidden text-sm font-semibold text-[#344054] md:block">
                상태
              </span>
              <span className="text-sm font-semibold text-[#344054]">작업</span>
            </div>
            {entries.length === 0 ? (
              <div className="px-4 py-6 text-sm text-[#667085]">
                현재 회차에 연결된 작성 링크가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-[#c8d3df]">
                {entries.map((entry) => {
                  const writePath = `/write/${entry.teamId}/${latestCycle.id}`;
                  const writeUrl = makeAbsoluteUrl(writePath);

                  return (
                    <div
                      key={entry.id}
                      className="grid gap-3 px-4 py-3 md:grid-cols-[180px_1fr_110px_180px] md:items-center"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#102a43]">
                          {entry.team.name}
                        </p>
                        <p className="mt-1 text-xs text-[#667085]">
                          {entry.team.departmentName} · {entry.workItems.length}개 항목
                        </p>
                      </div>
                      <code className="hidden min-w-0 overflow-hidden text-ellipsis whitespace-nowrap border border-[#d6dbe1] bg-white px-3 py-2 text-xs text-[#344054] md:block">
                        {writeUrl}
                      </code>
                      <span className="w-fit border border-[#c8d3df] bg-white px-3 py-1 text-sm text-[#344054]">
                        {entryStatusLabel(entry.status)}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={writePath}
                          className="gov-action inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden />
                          작성 열기
                        </Link>
                        <CopyLinkButton value={writeUrl} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
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
