"use server";

import { notFound, redirect } from "next/navigation";
import { canWriteTeam, requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function openWriteEntry(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const cycleId = String(formData.get("cycleId") ?? "");

  if (!teamId || !cycleId) {
    notFound();
  }

  const user = await requireApprovedUser();
  if (!canWriteTeam(user, teamId)) {
    notFound();
  }

  const entry = await prisma.reportEntry.findUnique({
    where: {
      reportCycleId_teamId: {
        reportCycleId: cycleId,
        teamId,
      },
    },
    select: { id: true },
  });

  if (!entry) {
    notFound();
  }

  redirect(`/write/${teamId}/${cycleId}`);
}
