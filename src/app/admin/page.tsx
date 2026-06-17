import Link from "next/link";
import {
  CalendarDays,
  FileText,
  LockKeyhole,
  LogOut,
  Network,
  Printer,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/page-shell";
import { requireAdminUser } from "@/lib/auth";
import type { CurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const setupItems = [
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
];

const securityItems = [
  "행정망 또는 폐쇄망 고정 IP에서만 접근",
  "관리자 로그인은 허용 IP 내부에서만 노출",
  "팀별 작성 링크와 읽기 전용 링크도 외부 접근 차단",
  "PostgreSQL은 Docker 내부 네트워크에서만 접근",
];

async function getDashboardData(user: CurrentUser) {
  const teamWhere =
    user.role === "super_admin"
      ? { isActive: true }
      : { isActive: true, departmentName: user.managedDepartmentName ?? "" };

  try {
    const [activeTeams, latestCycle] = await Promise.all([
      prisma.team.count({ where: teamWhere }),
      prisma.reportCycle.findFirst({
        orderBy: [{ status: "asc" }, { startDate: "desc" }],
        include: {
          entries: {
            where:
              user.role === "super_admin"
                ? undefined
                : { team: { departmentName: user.managedDepartmentName ?? "" } },
            select: { status: true },
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
  const submittedCount =
    dashboard.latestCycle?.entries.filter((entry) =>
      ["submitted", "completed"].includes(entry.status),
    ).length ?? 0;
  const totalEntries = dashboard.latestCycle?.entries.length ?? 0;
  const menuItems = [
    ...setupItems,
    {
      label: "사용자 관리",
      description: "가입 대기 승인과 사용자 역할을 관리합니다.",
      href: "/admin/users",
      icon: UserCog,
    },
    {
      label: "보고서 미리보기",
      description: dashboard.latestCycle
        ? "현재 회차에 입력된 내용을 보고서 형태로 확인합니다."
        : "회차를 만든 뒤 실제 보고서를 확인할 수 있습니다.",
      href: dashboard.latestCycle
        ? `/admin/cycles/${dashboard.latestCycle.id}/preview`
        : "/admin/cycles",
      icon: FileText,
    },
  ];

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
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="gov-kpi gov-panel p-4">
              <p className="text-sm text-[#667085]">활성 팀</p>
              <p className="mt-2 text-2xl font-semibold">{dashboard.activeTeams}</p>
            </div>
            <div className="gov-kpi gov-panel p-4">
              <p className="text-sm text-[#667085]">현재 회차</p>
              <p className="mt-2 truncate text-lg font-semibold">
                {dashboard.latestCycle?.title ?? "회차 없음"}
              </p>
            </div>
            <div className="gov-kpi gov-panel p-4">
              <p className="text-sm text-[#667085]">제출 현황</p>
              <p className="mt-2 text-2xl font-semibold">
                {submittedCount}/{totalEntries}
              </p>
            </div>
          </div>
          {dashboard.error ? (
            <div className="gov-panel mb-6 p-4 text-sm text-[#667085]">
              {dashboard.error}
            </div>
          ) : null}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="gov-section-title text-xl">업무 메뉴</h2>
            <span className="text-sm text-[#667085]">MVP 기반 구성 중</span>
          </div>
          <div className="grid gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="gov-panel group flex items-center justify-between p-4 transition hover:border-[#005bac]"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center bg-[#e7f1fb]">
                      <Icon className="h-5 w-5 text-[#005bac]" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-sm text-[#667085]">
                        {item.description}
                      </span>
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[#005bac] group-hover:underline">
                    열기
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="gov-panel p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-[#e7f1fb]">
              <LockKeyhole className="h-5 w-5 text-[#005bac]" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">보안 전제</h2>
              <p className="text-sm text-[#667085]">일반 인터넷 공개 없음</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {securityItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-[#005bac]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border border-[#c8d3df] bg-[#f6f9fc] p-4 text-sm leading-6 text-[#344054]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#171717]">
              <Printer className="h-4 w-4 text-[#005bac]" aria-hidden />
              PDF 출력
            </div>
            첫 버전은 보고서 화면의 인쇄 스타일을 사용해 PDF로 저장합니다.
          </div>
        </aside>
      </section>
    </PageShell>
  );
}
