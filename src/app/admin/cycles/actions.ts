"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTokenPair } from "@/lib/tokens";

const cycleSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startDate: z.string().trim().min(1),
    endDate: z.string().trim().min(1),
    dueDate: z.string().trim().min(1),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "보고 시작일은 종료일보다 늦을 수 없습니다.",
    path: ["startDate"],
  });

export async function createCycle(formData: FormData) {
  const parsed = cycleSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    dueDate: formData.get("dueDate"),
  });

  if (!parsed.success) {
    return;
  }

  const activeTeams = await prisma.team.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  const shareToken = createTokenPair();

  await prisma.reportCycle.create({
    data: {
      title: parsed.data.title,
      startDate: toDate(parsed.data.startDate),
      endDate: toDate(parsed.data.endDate),
      dueDate: toDate(parsed.data.dueDate),
      shareTokenHash: shareToken.tokenHash,
      entries: {
        create: activeTeams.map((team) => ({
          teamId: team.id,
        })),
      },
    },
  });

  revalidatePath("/admin/cycles");
  revalidatePath("/admin");
}

export async function updateCycle(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = cycleSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    dueDate: formData.get("dueDate"),
  });

  if (!id || !parsed.success) {
    return;
  }

  await prisma.reportCycle.update({
    where: { id },
    data: {
      title: parsed.data.title,
      startDate: toDate(parsed.data.startDate),
      endDate: toDate(parsed.data.endDate),
      dueDate: toDate(parsed.data.dueDate),
    },
  });

  revalidatePath("/admin/cycles");
  revalidatePath("/admin");
}

export async function toggleCycleStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status"));

  if (!id || !["draft", "completed"].includes(status)) {
    return;
  }

  await prisma.reportCycle.update({
    where: { id },
    data: {
      status: status === "draft" ? "completed" : "draft",
    },
  });

  revalidatePath("/admin/cycles");
  revalidatePath("/admin");
}

export async function rotateShareToken(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const shareToken = createTokenPair();

  await prisma.reportCycle.update({
    where: { id },
    data: { shareTokenHash: shareToken.tokenHash },
  });

  revalidatePath("/admin/cycles");
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
