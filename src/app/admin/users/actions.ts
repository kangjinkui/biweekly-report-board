"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageDepartment, requireAdminUser, requireSuperAdmin } from "@/lib/auth";
import { DEPARTMENT_NAMES } from "@/lib/organization";
import { prisma } from "@/lib/prisma";

const userIdSchema = z.string().uuid();

export async function approveUser(formData: FormData) {
  const actor = await requireAdminUser();
  const userId = userIdSchema.safeParse(formData.get("userId"));
  if (!userId.success) return;

  const user = await prisma.adminUser.findUnique({
    where: { id: userId.data },
    include: { team: true },
  });
  if (!user || !user.team || !canManageDepartment(actor, user.team.departmentName)) return;

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      status: "approved",
      approvedAt: new Date(),
      approvedById: actor.id,
    },
  });

  revalidateUsers();
}

export async function rejectUser(formData: FormData) {
  const actor = await requireAdminUser();
  const userId = userIdSchema.safeParse(formData.get("userId"));
  if (!userId.success) return;

  const user = await prisma.adminUser.findUnique({
    where: { id: userId.data },
    include: { team: true },
  });
  if (!user) return;
  if (user.role === "super_admin" && (await isLastSuperAdmin(user.id))) return;
  if (actor.role !== "super_admin") {
    if (!user.team || !canManageDepartment(actor, user.team.departmentName)) return;
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { status: "rejected" },
  });

  revalidateUsers();
}

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["super_admin", "department_manager", "team_user"]),
  managedDepartmentName: z.enum(DEPARTMENT_NAMES).optional().or(z.literal("")),
});

export async function updateUserRole(formData: FormData) {
  const actor = await requireSuperAdmin();
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    managedDepartmentName: formData.get("managedDepartmentName") ?? "",
  });

  if (!parsed.success) return;
  const target = await prisma.adminUser.findUnique({
    where: { id: parsed.data.userId },
    include: { team: true },
  });
  if (!target) return;
  if (target.role === "super_admin" && parsed.data.role !== "super_admin" && (await isLastSuperAdmin(target.id))) {
    return;
  }

  const managedDepartmentName =
    parsed.data.role === "department_manager"
      ? parsed.data.managedDepartmentName || target.team?.departmentName || null
      : null;

  if (parsed.data.role === "department_manager" && !managedDepartmentName) {
    return;
  }

  await prisma.adminUser.update({
    where: { id: target.id },
    data: {
      role: parsed.data.role,
      status: parsed.data.role === "team_user" ? target.status : "approved",
      approvedAt: target.approvedAt ?? new Date(),
      approvedById: target.approvedById ?? actor.id,
      managedDepartmentName,
    },
  });

  revalidateUsers();
}

async function isLastSuperAdmin(userId: string) {
  const count = await prisma.adminUser.count({
    where: {
      role: "super_admin",
      status: "approved",
      NOT: { id: userId },
    },
  });
  return count === 0;
}

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
