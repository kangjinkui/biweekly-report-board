import Link from "next/link";
import { ArrowLeft, Check, Save, UserX } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { canManageDepartment, requireAdminUser, roleLabel, statusLabel } from "@/lib/auth";
import { DEPARTMENT_NAMES } from "@/lib/organization";
import { prisma } from "@/lib/prisma";
import { approveUser, rejectUser, updateUserRole } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const actor = await requireAdminUser();
  const users = await prisma.adminUser.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { team: true },
  });
  const visibleUsers = users.filter((user) => {
    if (actor.role === "super_admin") return true;
    return user.team ? canManageDepartment(actor, user.team.departmentName) : false;
  });

  return (
    <PageShell
      title="사용자 관리"
      description="가입 대기자를 승인하고 사용자 역할을 관리합니다."
      maxWidth="max-w-6xl"
      actions={
        <Link href="/admin" className="inline-flex items-center gap-2 border border-white/30 px-3 py-2 text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          관리자 화면
        </Link>
      }
    >
      <div className="gov-panel overflow-x-auto">
        <div className="min-w-[1120px]">
        <div className="grid grid-cols-[1.2fr_1fr_90px_100px_410px] border-b border-[#8fa9c1] bg-[#e8f1fa] px-4 py-3 text-sm font-semibold text-[#102a43]">
          <span>사용자</span>
          <span>소속</span>
          <span>상태</span>
          <span>역할</span>
          <span>작업</span>
        </div>
        <div className="divide-y divide-[#c8d3df]">
          {visibleUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.2fr_1fr_90px_100px_410px] items-center gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold">{user.name || user.email}</p>
                <p className="mt-1 text-xs text-[#667085]">{user.email}</p>
              </div>
              <div className="text-[#667085]">
                {user.team ? `${user.team.departmentName} / ${user.team.name}` : user.managedDepartmentName ?? "-"}
              </div>
              <span>{statusLabel(user.status)}</span>
              <span>{roleLabel(user.role)}</span>
              <div className="flex flex-wrap gap-2">
                {user.status === "pending" ? (
                  <form action={approveUser}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="inline-flex h-9 w-9 items-center justify-center border border-[#8db8dd] text-[#005bac]" title="승인">
                      <Check className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                ) : null}
                <form action={rejectUser}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button className="inline-flex h-9 w-9 items-center justify-center border border-[#f4b4ad] text-[#b42318]" title="거절">
                    <UserX className="h-4 w-4" aria-hidden />
                  </button>
                </form>
                {actor.role === "super_admin" ? <RoleForm user={user} /> : null}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </PageShell>
  );
}

function RoleForm({
  user,
}: {
  user: {
    id: string;
    role: "super_admin" | "department_manager" | "team_user";
    managedDepartmentName: string | null;
    team: {
      departmentName: string;
    } | null;
  };
}) {
  const defaultManagedDepartmentName =
    user.managedDepartmentName ?? user.team?.departmentName ?? "";

  return (
    <form action={updateUserRole} className="flex shrink-0 gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <select name="role" defaultValue={user.role} className="w-32 border border-[#c8d3df] px-2 py-2">
        <option value="team_user">팀 작성자</option>
        <option value="department_manager">과별관리자</option>
        <option value="super_admin">전체관리자</option>
      </select>
      <select
        name="managedDepartmentName"
        defaultValue={defaultManagedDepartmentName}
        className="w-36 border border-[#c8d3df] px-2 py-2"
      >
        <option value="">관리 과</option>
        {DEPARTMENT_NAMES.map((departmentName) => (
          <option key={departmentName} value={departmentName}>
            {departmentName}
          </option>
        ))}
      </select>
      <button className="inline-flex h-9 w-9 items-center justify-center border border-[#8db8dd] text-[#005bac]" title="역할 저장">
        <Save className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
