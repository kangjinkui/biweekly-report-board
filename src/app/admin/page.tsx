import Link from "next/link";
import {
  CalendarDays,
  FileText,
  LockKeyhole,
  Network,
  Printer,
  ShieldCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

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
  {
    label: "보고서 미리보기",
    description: "팀별 입력 내용을 하나의 보고서 형태로 확인합니다.",
    href: "/admin/preview",
    icon: FileText,
  },
];

const securityItems = [
  "행정망 또는 폐쇄망 고정 IP에서만 접근",
  "관리자 로그인은 허용 IP 내부에서만 노출",
  "팀별 작성 링크와 읽기 전용 링크도 외부 접근 차단",
  "PostgreSQL은 Docker 내부 네트워크에서만 접근",
];

async function getDashboardData() {
  try {
    const [activeTeams, latestCycle] = await Promise.all([
      prisma.team.count({ where: { isActive: true } }),
      prisma.reportCycle.findFirst({
        orderBy: [{ status: "asc" }, { startDate: "desc" }],
        include: {
          entries: {
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
  const dashboard = await getDashboardData();
  const submittedCount =
    dashboard.latestCycle?.entries.filter((entry) =>
      ["submitted", "completed"].includes(entry.status),
    ).length ?? 0;
  const totalEntries = dashboard.latestCycle?.entries.length ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-[#171717]">
      <section className="border-b border-[#d6dbe1] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#2457a7]">
                행정망 내부 업무 도구
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal">
                격주 업무보고 수합판
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#667085]">
                팀별 보고 내용을 웹에서 입력하고, 수합 현황과 보고서
                미리보기를 한곳에서 관리합니다.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm text-[#344054]">
              <ShieldCheck className="h-4 w-4 text-[#2457a7]" aria-hidden />
              IP 접근 제한 적용 예정
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded border border-[#d6dbe1] bg-white p-4">
              <p className="text-sm text-[#667085]">활성 팀</p>
              <p className="mt-2 text-2xl font-semibold">{dashboard.activeTeams}</p>
            </div>
            <div className="rounded border border-[#d6dbe1] bg-white p-4">
              <p className="text-sm text-[#667085]">현재 회차</p>
              <p className="mt-2 truncate text-lg font-semibold">
                {dashboard.latestCycle?.title ?? "회차 없음"}
              </p>
            </div>
            <div className="rounded border border-[#d6dbe1] bg-white p-4">
              <p className="text-sm text-[#667085]">제출 현황</p>
              <p className="mt-2 text-2xl font-semibold">
                {submittedCount}/{totalEntries}
              </p>
            </div>
          </div>
          {dashboard.error ? (
            <div className="mb-6 rounded border border-[#d6dbe1] bg-white p-4 text-sm text-[#667085]">
              {dashboard.error}
            </div>
          ) : null}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">구축 시작 화면</h2>
            <span className="text-sm text-[#667085]">MVP 기반 구성 중</span>
          </div>
          <div className="grid gap-3">
            {setupItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded border border-[#d6dbe1] bg-white p-4 transition hover:border-[#2457a7]"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded border border-[#d6dbe1] bg-[#f7f8fa]">
                      <Icon className="h-5 w-5 text-[#2457a7]" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-1 block text-sm text-[#667085]">
                        {item.description}
                      </span>
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[#2457a7] group-hover:underline">
                    열기
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="rounded border border-[#d6dbe1] bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded border border-[#d6dbe1] bg-[#f7f8fa]">
              <LockKeyhole className="h-5 w-5 text-[#2457a7]" aria-hidden />
            </span>
            <div>
              <h2 className="font-semibold">보안 전제</h2>
              <p className="text-sm text-[#667085]">일반 인터넷 공개 없음</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {securityItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6">
                <Network className="mt-0.5 h-4 w-4 shrink-0 text-[#2457a7]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded border border-[#d6dbe1] bg-[#f7f8fa] p-4 text-sm leading-6 text-[#344054]">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#171717]">
              <Printer className="h-4 w-4 text-[#2457a7]" aria-hidden />
              PDF 출력
            </div>
            첫 버전은 보고서 화면의 인쇄 스타일을 사용해 PDF로 저장합니다.
          </div>
        </aside>
      </section>
    </main>
  );
}
