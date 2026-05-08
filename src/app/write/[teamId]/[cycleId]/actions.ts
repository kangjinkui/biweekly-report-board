"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const workItemSchema = z.object({
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(5000).default(""),
  nextPlan: z.string().trim().max(5000).default(""),
  note: z.string().trim().max(5000).optional(),
});

export async function addWorkItem(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");

  if (!entryId || !teamId || !cycleId) return;

  const lastItem = await prisma.workItem.findFirst({
    where: { reportEntryId: entryId },
    orderBy: { displayOrder: "desc" },
    select: { displayOrder: true },
  });

  await prisma.$transaction([
    prisma.workItem.create({
      data: {
        reportEntryId: entryId,
        title: "",
        description: "",
        nextPlan: "",
        note: "",
        displayOrder: (lastItem?.displayOrder ?? 0) + 1,
      },
    }),
    prisma.reportEntry.update({
      where: { id: entryId },
      data: {
        status: "in_progress",
        submittedAt: null,
      },
    }),
  ]);

  revalidatePath(writePath(teamId, cycleId));
  revalidateAdminPaths(cycleId);
}

export async function updateWorkItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");

  const parsed = workItemSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    nextPlan: formData.get("nextPlan") ?? "",
    note: formData.get("note") ?? "",
  });

  if (!itemId || !entryId || !teamId || !cycleId || !parsed.success) return;

  await prisma.$transaction([
    prisma.workItem.update({
      where: { id: itemId },
      data: parsed.data,
    }),
    prisma.reportEntry.update({
      where: { id: entryId },
      data: {
        status: "in_progress",
        submittedAt: null,
      },
    }),
  ]);

  revalidatePath(writePath(teamId, cycleId));
  revalidateAdminPaths(cycleId);
}

export async function deleteWorkItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");

  if (!itemId || !entryId || !teamId || !cycleId) return;

  await prisma.$transaction([
    prisma.workItem.delete({
      where: { id: itemId },
    }),
    prisma.reportEntry.update({
      where: { id: entryId },
      data: {
        status: "in_progress",
        submittedAt: null,
      },
    }),
  ]);

  await normalizeDisplayOrder(entryId);
  revalidatePath(writePath(teamId, cycleId));
  revalidateAdminPaths(cycleId);
}

export async function moveWorkItem(formData: FormData) {
  const itemId = String(formData.get("itemId") ?? "");
  const entryId = String(formData.get("entryId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");
  const direction = String(formData.get("direction"));

  if (!itemId || !entryId || !teamId || !cycleId || !["up", "down"].includes(direction)) {
    return;
  }

  const current = await prisma.workItem.findUnique({ where: { id: itemId } });
  if (!current) return;

  const neighbor = await prisma.workItem.findFirst({
    where: {
      reportEntryId: entryId,
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
    prisma.workItem.update({
      where: { id: current.id },
      data: { displayOrder: neighbor.displayOrder },
    }),
    prisma.workItem.update({
      where: { id: neighbor.id },
      data: { displayOrder: current.displayOrder },
    }),
    prisma.reportEntry.update({
      where: { id: entryId },
      data: { status: "in_progress", submittedAt: null },
    }),
  ]);

  revalidatePath(writePath(teamId, cycleId));
  revalidateAdminPaths(cycleId);
}

export async function submitEntry(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");

  if (!entryId || !teamId || !cycleId) return;

  const validItems = await prisma.workItem.count({
    where: {
      reportEntryId: entryId,
      OR: [{ title: { not: "" } }, { description: { not: "" } }],
    },
  });

  if (validItems === 0) {
    return;
  }

  await prisma.reportEntry.update({
    where: { id: entryId },
    data: {
      status: "submitted",
      submittedAt: new Date(),
    },
  });

  revalidatePath(writePath(teamId, cycleId));
  revalidateAdminPaths(cycleId);
}

export async function copyPreviousEntry(formData: FormData) {
  const entryId = String(formData.get("entryId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");

  if (!entryId || !teamId || !cycleId) return;

  const currentCycle = await prisma.reportCycle.findUnique({
    where: { id: cycleId },
    select: { startDate: true },
  });
  if (!currentCycle) return;

  const previousEntry = await prisma.reportEntry.findFirst({
    where: {
      teamId,
      cycle: {
        startDate: { lt: currentCycle.startDate },
      },
    },
    orderBy: {
      cycle: { startDate: "desc" },
    },
    include: {
      workItems: {
        orderBy: { displayOrder: "asc" },
      },
    },
  });

  if (!previousEntry || previousEntry.workItems.length === 0) return;

  await prisma.$transaction([
    prisma.workItem.deleteMany({
      where: { reportEntryId: entryId },
    }),
    prisma.workItem.createMany({
      data: previousEntry.workItems.map((item, index) => ({
        reportEntryId: entryId,
        title: item.title,
        description: item.description,
        nextPlan: item.nextPlan,
        note: item.note,
        displayOrder: index + 1,
      })),
    }),
    prisma.reportEntry.update({
      where: { id: entryId },
      data: {
        status: "in_progress",
        submittedAt: null,
      },
    }),
  ]);

  revalidatePath(writePath(teamId, cycleId));
  revalidateAdminPaths(cycleId);
}

async function normalizeDisplayOrder(entryId: string) {
  const items = await prisma.workItem.findMany({
    where: { reportEntryId: entryId },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });

  await prisma.$transaction(
    items.map((item, index) =>
      prisma.workItem.update({
        where: { id: item.id },
        data: { displayOrder: index + 1 },
      }),
    ),
  );
}

function writePath(teamId: string, cycleId: string) {
  return `/write/${teamId}/${cycleId}`;
}

function revalidateAdminPaths(cycleId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/cycles");
  revalidatePath(`/admin/cycles/${cycleId}/status`);
  revalidatePath(`/admin/cycles/${cycleId}/preview`);
  revalidatePath(`/director/cycles/${cycleId}`);
}
