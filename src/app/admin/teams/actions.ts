"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTokenPair } from "@/lib/tokens";
import { DEPARTMENT_NAMES } from "@/lib/organization";
import { ensureDraftCycleEntriesForTeam } from "@/lib/report-entries";
import { canManageDepartment, requireAdminUser } from "@/lib/auth";

const teamSchema = z.object({
  name: z.string().trim().min(1, "팀명을 입력하세요.").max(100),
  departmentName: z.enum(DEPARTMENT_NAMES),
});

export async function createTeam(formData: FormData) {
  const user = await requireAdminUser();
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    departmentName: formData.get("departmentName"),
  });

  if (!parsed.success) {
    return;
  }
  if (!canManageDepartment(user, parsed.data.departmentName)) return;

  const lastTeam = await prisma.team.findFirst({
    where: { departmentName: parsed.data.departmentName },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });

  const token = createTokenPair();

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      departmentName: parsed.data.departmentName,
      displayOrder: (lastTeam?.displayOrder ?? 0) + 1,
      writeTokenHash: token.tokenHash,
    },
  });

  await ensureDraftCycleEntriesForTeam(team.id);

  revalidatePath("/admin/teams");
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/cycles/links");
  revalidatePath("/admin");
}

export async function updateTeamName(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    departmentName: formData.get("departmentName"),
  });

  if (!id || !parsed.success) {
    return;
  }
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return;
  if (!canManageDepartment(user, team.departmentName)) return;
  if (!canManageDepartment(user, parsed.data.departmentName)) return;

  const data: { name: string; departmentName: string; displayOrder?: number } = {
    name: parsed.data.name,
    departmentName: parsed.data.departmentName,
  };

  if (team.departmentName !== parsed.data.departmentName) {
    const lastTeam = await prisma.team.findFirst({
      where: { departmentName: parsed.data.departmentName },
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    data.displayOrder = (lastTeam?.displayOrder ?? 0) + 1;
  }

  await prisma.team.update({
    where: { id },
    data,
  });

  if (team.departmentName !== parsed.data.departmentName) {
    await normalizeTeamOrder(team.departmentName);
    await normalizeTeamOrder(parsed.data.departmentName);
  }

  revalidatePath("/admin/teams");
  revalidatePath("/admin");
}

export async function toggleTeamActive(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive")) === "true";

  if (!id) {
    return;
  }
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team || !canManageDepartment(user, team.departmentName)) return;

  await prisma.team.update({
    where: { id },
    data: { isActive: !isActive },
  });

  if (!isActive) {
    await ensureDraftCycleEntriesForTeam(id);
  }

  revalidatePath("/admin/teams");
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/cycles/links");
  revalidatePath("/admin");
}

export async function moveTeam(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction"));

  if (!id || !["up", "down"].includes(direction)) {
    return;
  }

  const current = await prisma.team.findUnique({ where: { id } });
  if (!current) return;
  if (!canManageDepartment(user, current.departmentName)) return;

  const teams = await prisma.team.findMany({
    where: { departmentName: current.departmentName },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const currentIndex = teams.findIndex((team) => team.id === current.id);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= teams.length) return;

  const reorderedTeams = [...teams];
  [reorderedTeams[currentIndex], reorderedTeams[targetIndex]] = [
    reorderedTeams[targetIndex],
    reorderedTeams[currentIndex],
  ];

  await prisma.$transaction(
    reorderedTeams.map((team, index) =>
      prisma.team.update({
        where: { id: team.id },
        data: { displayOrder: index + 1 },
      }),
    ),
  );

  revalidatePath("/admin/teams");
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/cycles/links");
  revalidatePath("/admin");
}

export async function deleteTeam(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team || !canManageDepartment(user, team.departmentName)) return;

  await prisma.$transaction(async (tx) => {
    await tx.adminUser.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    });
    await tx.reportEntry.deleteMany({ where: { teamId: id } });
    await tx.team.delete({ where: { id } });

    const remainingTeams = await tx.team.findMany({
      where: { departmentName: team.departmentName },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });

    await Promise.all(
      remainingTeams.map((remainingTeam, index) =>
        tx.team.update({
          where: { id: remainingTeam.id },
          data: { displayOrder: index + 1 },
        }),
      ),
    );
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/cycles");
  revalidatePath("/admin/cycles/links");
  revalidatePath("/admin");
}

export async function rotateTeamWriteToken(formData: FormData) {
  const user = await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team || !canManageDepartment(user, team.departmentName)) return;

  const token = createTokenPair();

  await prisma.team.update({
    where: { id },
    data: { writeTokenHash: token.tokenHash },
  });

  revalidatePath("/admin/teams");
}

async function normalizeTeamOrder(departmentName: string) {
  const teams = await prisma.team.findMany({
    where: { departmentName },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  await prisma.$transaction(
    teams.map((team, index) =>
      prisma.team.update({
        where: { id: team.id },
        data: { displayOrder: index + 1 },
      }),
    ),
  );
}
