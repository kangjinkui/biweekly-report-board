import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ClipboardCopy,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  addWorkItem,
  copyPreviousEntry,
  deleteWorkItem,
  moveWorkItem,
  submitEntry,
} from "./actions";
import { WorkItemEditor } from "./work-item-editor";
import { formatCyclePeriodSummary, formatKoreanDate } from "@/lib/report-cycle";
import { PageShell } from "@/components/page-shell";
import { ReportTwoColumnTable } from "@/components/report-two-column-table";
import { WORK_ITEM_TYPE_LABELS, WORK_ITEM_TYPES } from "@/lib/work-items";
import { canWriteTeam, requireApprovedUser, type CurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type WritePageProps = {
  params: Promise<{
    teamId: string;
    cycleId: string;
  }>;
};

export default async function WritePage({ params }: WritePageProps) {
  const user = await requireApprovedUser();
  const { teamId, cycleId } = await params;
  const data = await getWriteData(teamId, cycleId, user);

  if (!data) {
    notFound();
  }

  const { team, cycle, entry, departmentEntries } = data;
  const canEdit = canWriteTeam(user, teamId);
  const isSubmitted = entry.status === "submitted";
  const periodSummary = formatCyclePeriodSummary(cycle);

  return (
    <PageShell
      eyebrow={`${team.name} 작성 화면`}
      title={cycle.title}
      description={`${periodSummary.project} / ${periodSummary.previous} / ${periodSummary.current} / 마감일 ${formatKoreanDate(cycle.dueDate)}`}
      maxWidth="max-w-5xl"
      actions={
        <div className="border border-[#7db5e5] bg-white/10 px-4 py-3 text-sm">
          <span className="text-[#d7ecff]">상태</span>
          <span className="ml-2 font-semibold text-white">
            {entryStatusLabel(entry.status)}
          </span>
        </div>
      }
    >
      <Link
        href={canEdit ? "/my" : "/admin"}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#005bac]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {canEdit ? "내 업무보고" : "관리자 화면"}
      </Link>

      {canEdit ? (
        <section className="mt-6 flex flex-wrap gap-3">
          <form action={addWorkItem}>
            <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
            <div className="inline-flex flex-wrap gap-2">
              {WORK_ITEM_TYPES.map((itemType) => (
                <button
                  key={itemType}
                  name="itemType"
                  value={itemType}
                  className="gov-action inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {WORK_ITEM_TYPE_LABELS[itemType]} 추가
                </button>
              ))}
            </div>
          </form>

          <form action={copyPreviousEntry}>
            <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
            <button className="gov-subtle-action inline-flex items-center gap-2 border px-4 py-2 text-sm font-semibold">
              <ClipboardCopy className="h-4 w-4" aria-hidden />
              지난 회차 복사
            </button>
          </form>

          <form action={submitEntry}>
            <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
            <button
              className="inline-flex items-center gap-2 border border-[#005bac] bg-white px-4 py-2 text-sm font-semibold text-[#005bac] disabled:cursor-not-allowed disabled:border-[#c8d3df] disabled:text-[#667085]"
              disabled={entry.workItems.length === 0}
            >
              <Send className="h-4 w-4" aria-hidden />
              제출
            </button>
          </form>
        </section>
      ) : null}

      {isSubmitted ? (
        <div className="gov-panel mt-4 p-4 text-sm text-[#344054]">
          제출 완료 상태입니다. 내용을 수정하면 작성 중 상태로 돌아갑니다.
        </div>
      ) : null}

      {entry.workItems.length === 0 ? (
        <div className="gov-panel mt-6 p-8 text-center">
          <h2 className="font-semibold">
            {canEdit ? "입력된 업무 항목이 없습니다" : "아직 작성 전입니다"}
          </h2>
          <p className="mt-2 text-sm text-[#667085]">
            {canEdit
              ? "보고 항목 추가를 눌러 지난 업무 실적과 다음 주 계획을 작성하세요."
              : "이 팀은 이번 회차 보고서를 아직 작성하지 않았습니다."}
          </p>
        </div>
      ) : !canEdit ? (
        <div className="gov-panel mt-6 p-4">
          <ReportTwoColumnTable
            items={entry.workItems}
            previousLabel={periodSummary.previous}
            currentLabel={periodSummary.current}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {entry.workItems.map((item, index) => (
            <section key={item.id} className="gov-panel p-4">
              <WorkItemEditor
                item={item}
                entryId={entry.id}
                teamId={team.id}
                cycleId={cycle.id}
                index={index}
                previousPeriodLabel={periodSummary.previous}
                currentPeriodLabel={periodSummary.current}
              />

              <div className="mt-4 flex gap-2 border-t border-[#c8d3df] pt-4">
                <form action={moveWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]" title="위로 이동">
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <form action={moveWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df]" title="아래로 이동">
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                <form action={deleteWorkItem}>
                  <HiddenContext entryId={entry.id} teamId={team.id} cycleId={cycle.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#c8d3df] text-[#b42318]" title="삭제">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </form>
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="gov-panel mt-8 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#c8d3df] pb-4">
          <div>
            <h2 className="text-lg font-semibold text-[#003f7d]">
              {team.departmentName} 주간업무보고
            </h2>
            <p className="mt-1 text-sm text-[#667085]">
              {canEdit
                ? "같은 부서에서 이번 회차에 작성 중인 보고만 표시합니다."
                : "담당 과 전체 팀의 이번 회차 보고를 작성 전까지 표시합니다."}
            </p>
          </div>
          <span className="border border-[#c8d3df] bg-white px-3 py-1 text-sm text-[#344054]">
            {departmentEntries.length}개 팀
          </span>
        </div>

        {departmentEntries.length === 0 ? (
          <p className="mt-5 border border-[#c8d3df] bg-white px-4 py-4 text-sm text-[#667085]">
            아직 같은 부서에서 작성 중인 보고가 없습니다.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            {departmentEntries.map((departmentEntry) => (
              <section key={departmentEntry.id} className="border border-[#c8d3df] bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8d3df] bg-[#f6f9fc] px-4 py-3">
                  <div>
                    <h3 className="font-semibold">{departmentEntry.team.name}</h3>
                    <p className="mt-1 text-sm text-[#667085]">
                      보고 항목 {departmentEntry.workItems.length}개
                    </p>
                  </div>
                  <span className="border border-[#c8d3df] bg-white px-3 py-1 text-sm text-[#344054]">
                    {entryStatusLabel(departmentEntry.status)}
                  </span>
                </div>
                {departmentEntry.workItems.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-[#667085]">
                    {departmentEntry.status === "not_started"
                      ? "아직 작성 전입니다."
                      : "입력된 업무 항목이 없습니다."}
                  </p>
                ) : (
                  <ReportTwoColumnTable
                    items={departmentEntry.workItems}
                    previousLabel={periodSummary.previous}
                    currentLabel={periodSummary.current}
                  />
                )}
              </section>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

async function getWriteData(
  teamId: string,
  cycleId: string,
  user: CurrentUser,
) {
  const [team, cycle] = await Promise.all([
    prisma.team.findUnique({ where: { id: teamId } }),
    prisma.reportCycle.findUnique({ where: { id: cycleId } }),
  ]);

  if (!team || !cycle || !team.isActive) {
    return null;
  }

  const canEdit = canWriteTeam(user, teamId);
  const canViewDepartment =
    user.role === "super_admin" ||
    (user.role === "department_manager" &&
      user.managedDepartmentName === team.departmentName);
  const departmentName = canViewDepartment
    ? team.departmentName
    : user.team?.departmentName;

  if (!canEdit && !canViewDepartment) {
    return null;
  }

  if (!departmentName || team.departmentName !== departmentName) {
    return null;
  }

  const departmentTeams = await prisma.team.findMany({
    where: {
      departmentName,
      isActive: true,
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: { id: true },
  });
  const departmentTeamIds = departmentTeams.map((departmentTeam) => departmentTeam.id);

  if (canViewDepartment) {
    await prisma.reportEntry.createMany({
      data: departmentTeamIds.map((departmentTeamId) => ({
        reportCycleId: cycleId,
        teamId: departmentTeamId,
      })),
      skipDuplicates: true,
    });
  }

  const entry = await prisma.reportEntry.upsert({
    where: {
      reportCycleId_teamId: {
        reportCycleId: cycleId,
        teamId,
      },
    },
    update: {},
    create: {
      reportCycleId: cycleId,
      teamId,
    },
    include: {
      workItems: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  const departmentEntries = await prisma.reportEntry.findMany({
    where: {
      reportCycleId: cycleId,
      teamId: { in: departmentTeamIds },
      ...(canViewDepartment
        ? {}
        : {
            status: { not: "not_started" as const },
            workItems: { some: {} },
          }),
    },
    orderBy: [{ team: { displayOrder: "asc" } }, { createdAt: "asc" }],
    include: {
      team: true,
      workItems: {
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return { team, cycle, entry, departmentEntries };
}

function HiddenContext({
  entryId,
  teamId,
  cycleId,
}: {
  entryId: string;
  teamId: string;
  cycleId: string;
}) {
  return (
    <>
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="cycleId" value={cycleId} />
    </>
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
