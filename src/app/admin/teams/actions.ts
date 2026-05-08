"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTokenPair } from "@/lib/tokens";
import { DEPARTMENT_NAMES } from "@/lib/organization";

const teamSchema = z.object({
  name: z.string().trim().min(1, "팀명을 입력하세요.").max(100),
  departmentName: z.enum(DEPARTMENT_NAMES),
});

export async function createTeam(formData: FormData) {
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    departmentName: formData.get("departmentName"),
  });

  if (!parsed.success) {
    return;
  }

  const lastTeam = await prisma.team.findFirst({
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });

  const token = createTokenPair();

  await prisma.team.create({
    data: {
      name: parsed.data.name,
      departmentName: parsed.data.departmentName,
      displayOrder: (lastTeam?.displayOrder ?? 0) + 1,
      writeTokenHash: token.tokenHash,
    },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin");
}

export async function updateTeamName(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    departmentName: formData.get("departmentName"),
  });

  if (!id || !parsed.success) {
    return;
  }

  await prisma.team.update({
    where: { id },
    data: {
      name: parsed.data.name,
      departmentName: parsed.data.departmentName,
    },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin");
}

export async function toggleTeamActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive")) === "true";

  if (!id) {
    return;
  }

  await prisma.team.update({
    where: { id },
    data: { isActive: !isActive },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin");
}

export async function moveTeam(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction"));

  if (!id || !["up", "down"].includes(direction)) {
    return;
  }

  const current = await prisma.team.findUnique({ where: { id } });
  if (!current) return;

  const neighbor = await prisma.team.findFirst({
    where: {
      displayOrder:
        direction === "up"
          ? { lt: current.displayOrder }
          : { gt: current.displayOrder },
    },
    orderBy: {
      displayOrder: direction === "up" ? "desc" : "asc",
    },
  });

  if (!neighbor) return;

  await prisma.$transaction([
    prisma.team.update({
      where: { id: current.id },
      data: { displayOrder: neighbor.displayOrder },
    }),
    prisma.team.update({
      where: { id: neighbor.id },
      data: { displayOrder: current.displayOrder },
    }),
  ]);

  revalidatePath("/admin/teams");
  revalidatePath("/admin");
}

export async function rotateTeamWriteToken(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const token = createTokenPair();

  await prisma.team.update({
    where: { id },
    data: { writeTokenHash: token.tokenHash },
  });

  revalidatePath("/admin/teams");
}
