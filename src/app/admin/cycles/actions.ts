"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTokenPair } from "@/lib/tokens";
import { requireAdminUser } from "@/lib/auth";

const cycleSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startDate: z.string().trim().min(1),
    endDate: z.string().trim().min(1),
    previousStartDate: z.string().trim().min(1),
    previousEndDate: z.string().trim().min(1),
    currentStartDate: z.string().trim().min(1),
    currentEndDate: z.string().trim().min(1),
    dueDate: z.string().trim().min(1),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "추진 시작일은 종료일보다 늦을 수 없습니다.",
    path: ["startDate"],
  })
  .refine((data) => data.previousStartDate <= data.previousEndDate, {
    message: "지난주실적 시작일은 종료일보다 늦을 수 없습니다.",
    path: ["previousStartDate"],
  })
  .refine((data) => data.currentStartDate <= data.currentEndDate, {
    message: "금주계획 시작일은 종료일보다 늦을 수 없습니다.",
    path: ["currentStartDate"],
  })
  .refine(
    (data) =>
      data.startDate <= data.previousStartDate &&
      data.previousEndDate <= data.endDate &&
      data.startDate <= data.currentStartDate &&
      data.currentEndDate <= data.endDate,
    {
      message: "지난주실적과 금주계획 기간은 추진기간 안에 있어야 합니다.",
      path: ["startDate"],
    },
  )
  .refine((data) => data.previousEndDate < data.currentStartDate, {
    message: "금주계획은 지난주실적 이후 날짜로 입력하세요.",
    path: ["currentStartDate"],
  });

export async function createCycle(formData: FormData) {
  await requireAdminUser();
  const parsed = cycleSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    previousStartDate: formData.get("previousStartDate"),
    previousEndDate: formData.get("previousEndDate"),
    currentStartDate: formData.get("currentStartDate"),
    currentEndDate: formData.get("currentEndDate"),
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
      previousStartDate: toDate(parsed.data.previousStartDate),
      previousEndDate: toDate(parsed.data.previousEndDate),
      currentStartDate: toDate(parsed.data.currentStartDate),
      currentEndDate: toDate(parsed.data.currentEndDate),
      dueDate: toDate(parsed.data.dueDate),
      shareToken: shareToken.token,
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
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  const parsed = cycleSchema.safeParse({
    title: formData.get("title"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    previousStartDate: formData.get("previousStartDate"),
    previousEndDate: formData.get("previousEndDate"),
    currentStartDate: formData.get("currentStartDate"),
    currentEndDate: formData.get("currentEndDate"),
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
      previousStartDate: toDate(parsed.data.previousStartDate),
      previousEndDate: toDate(parsed.data.previousEndDate),
      currentStartDate: toDate(parsed.data.currentStartDate),
      currentEndDate: toDate(parsed.data.currentEndDate),
      dueDate: toDate(parsed.data.dueDate),
    },
  });

  revalidatePath("/admin/cycles");
  revalidatePath("/admin");
}

export async function toggleCycleStatus(formData: FormData) {
  await requireAdminUser();
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
  await requireAdminUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const shareToken = createTokenPair();

  await prisma.reportCycle.update({
    where: { id },
    data: {
      shareToken: shareToken.token,
      shareTokenHash: shareToken.tokenHash,
    },
  });

  revalidatePath("/admin/cycles");
}

function toDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}
