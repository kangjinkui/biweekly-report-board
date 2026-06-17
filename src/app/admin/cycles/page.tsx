import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarPlus,
  Eye,
  ExternalLink,
  FileText,
  KeyRound,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  createCycle,
  rotateShareToken,
  toggleCycleStatus,
  updateCycle,
} from "./actions";
import { prisma } from "@/lib/prisma";
import { formatCyclePeriodSummary } from "@/lib/report-cycle";
import { PageShell } from "@/components/page-shell";
import { CycleAdminTabs } from "./cycle-admin-tabs";
import { requireAdminUser, type CurrentUser } from "@/lib/auth";
import { DirectorShareLinkButton } from "./director-share-link";

export const dynamic = "force-dynamic";

async function getCycles(user: CurrentUser) {
  try {
    return {
      cycles: await prisma.reportCycle.findMany({
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        include: {
          entries: {
            where:
              user.role === "super_admin"
                ? undefined
                : { team: { departmentName: user.managedDepartmentName ?? "" } },
            select: { id: true },
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

export default async function CyclesPage() {
  const user = await requireAdminUser();
  const { cycles, error } = await getCycles(user);

  return (
    <PageShell
      title="회차 관리"
      description="보고 기간을 만들고 팀별 작성, 과별 수합, 국장 보고 링크를 관리합니다."
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
          <button
            form="create-cycle-form"
            className="inline-flex items-center gap-2 bg-white px-4 py-2 text-sm font-semibold text-[#003f7d]"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            회차 생성
          </button>
        </>
      }
    >
      <CycleAdminTabs active="settings" />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="gov-section-title text-xl">회차 등록</h2>
        <button
          form="create-cycle-form"
          className="gov-action hidden items-center gap-2 px-4 py-2 text-sm font-semibold md:inline-flex"
        >
          <CalendarPlus className="h-4 w-4" aria-hidden />
          회차 생성
        </button>
      </div>

      <form
        id="create-cycle-form"
        action={createCycle}
        className="gov-panel grid gap-4 p-4"
      >
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <TextField
            label="보고 제목"
            name="title"
            placeholder="예: 2025년 5월 2차 업무보고"
          />
          <DateField label="마감일" name="dueDate" />
        </div>
        <CyclePeriodFields />
      </form>

      {error ? (
        <div className="gov-panel mt-6 p-8">
          <h2 className="font-semibold">회차 목록을 아직 불러올 수 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">{error}</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="gov-panel mt-6 p-8">
          <h2 className="font-semibold">등록된 회차가 없습니다</h2>
          <p className="mt-2 text-sm text-[#667085]">
            첫 회차를 만들면 활성 팀 기준으로 보고 엔트리가 함께 생성됩니다.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {cycles.map((cycle) => (
            <section
              key={cycle.id}
              className="gov-panel p-4"
            >
              <form
                action={updateCycle}
                className="grid gap-4"
              >
                <input type="hidden" name="id" value={cycle.id} />
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto]">
                  <TextField
                    label="보고 제목"
                    name="title"
                    defaultValue={cycle.title}
                  />
                  <DateField
                    label="마감일"
                    name="dueDate"
                    defaultValue={formatDateInput(cycle.dueDate)}
                  />
                  <button
                    className="mt-7 inline-flex h-10 w-10 items-center justify-center border border-[#8db8dd] text-[#005bac]"
                    title="회차 저장"
                  >
                    <Save className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <CyclePeriodFields cycle={cycle} />
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#c8d3df] bg-[#f6f9fc] px-4 py-3">
                <div className="text-sm text-[#667085]">
                  {formatCyclePeriodSummary(cycle).project}
                  <span className="mx-2">·</span>
                  상태:{" "}
                  <span className="font-semibold text-[#171717]">
                    {cycle.status === "draft" ? "작성 중" : "완료"}
                  </span>
                  <span className="mx-2">·</span>
                  팀별 보고 엔트리 {cycle.entries.length}개
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/cycles/${cycle.id}/status`}
                    className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm"
                  >
                    <BarChart3 className="h-4 w-4" aria-hidden />
                    현황
                  </Link>
                  <Link
                    href={`/admin/cycles/${cycle.id}/preview`}
                    className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    미리보기
                  </Link>
                  <Link
                    href={`/director/cycles/${cycle.id}`}
                    className="gov-action inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    국장 보고
                  </Link>
                  {cycle.shareToken ? (
                    <Link
                      href={`/share/director/${cycle.shareToken}`}
                      target="_blank"
                      className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      공유 보기
                    </Link>
                  ) : null}
                  <DirectorShareLinkButton shareToken={cycle.shareToken} />
                  <form action={toggleCycleStatus}>
                    <input type="hidden" name="id" value={cycle.id} />
                    <input type="hidden" name="status" value={cycle.status} />
                    <button className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm">
                      <RotateCcw className="h-4 w-4" aria-hidden />
                      상태 전환
                    </button>
                  </form>
                  <form action={rotateShareToken}>
                    <input type="hidden" name="id" value={cycle.id} />
                    <button className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm">
                      <KeyRound className="h-4 w-4" aria-hidden />
                      공유 링크 재발급
                    </button>
                  </form>
                </div>
              </div>

            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function CyclePeriodFields({
  cycle,
}: {
  cycle?: {
    startDate: Date;
    endDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
    currentStartDate: Date;
    currentEndDate: Date;
  };
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DateRangeField
        label="추진기간"
        startName="startDate"
        endName="endDate"
        startDefaultValue={cycle ? formatDateInput(cycle.startDate) : undefined}
        endDefaultValue={cycle ? formatDateInput(cycle.endDate) : undefined}
      />
      <DateRangeField
        label="지난주실적"
        startName="previousStartDate"
        endName="previousEndDate"
        startDefaultValue={cycle ? formatDateInput(cycle.previousStartDate) : undefined}
        endDefaultValue={cycle ? formatDateInput(cycle.previousEndDate) : undefined}
      />
      <DateRangeField
        label="금주계획"
        startName="currentStartDate"
        endName="currentEndDate"
        startDefaultValue={cycle ? formatDateInput(cycle.currentStartDate) : undefined}
        endDefaultValue={cycle ? formatDateInput(cycle.currentEndDate) : undefined}
      />
    </div>
  );
}

function DateRangeField({
  label,
  startName,
  endName,
  startDefaultValue,
  endDefaultValue,
}: {
  label: string;
  startName: string;
  endName: string;
  startDefaultValue?: string;
  endDefaultValue?: string;
}) {
  return (
    <fieldset className="border border-[#c8d3df] bg-[#f8fbfe] p-3">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        <DateField label="시작일" name={startName} defaultValue={startDefaultValue} />
        <DateField label="종료일" name={endName} defaultValue={endDefaultValue} />
      </div>
    </fieldset>
  );
}

function TextField({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded border border-[#d6dbe1] px-3 py-2"
        required
      />
    </label>
  );
}

function DateField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded border border-[#d6dbe1] px-3 py-2"
        required
      />
    </label>
  );
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}
