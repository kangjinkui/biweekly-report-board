"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canManageDepartment, requireAdminUser } from "@/lib/auth";

const statusSchema = z.object({
  cycleId: z.string().uuid(),
  entryId: z.string().uuid(),
  status: z.enum([
    "not_started",
    "in_progress",
    "submitted",
    "needs_revision",
    "completed",
  ]),
});

export async function updateEntryStatus(formData: FormData) {
  const user = await requireAdminUser();
  const parsed = statusSchema.safeParse({
    cycleId: formData.get("cycleId"),
    entryId: formData.get("entryId"),
    status: formData.get("status"),
  });

  if (!parsed.success) return;
  const entry = await prisma.reportEntry.findUnique({
    where: { id: parsed.data.entryId },
    include: { team: true },
  });
  if (!entry || !canManageDepartment(user, entry.team.departmentName)) return;

  await prisma.reportEntry.update({
    where: { id: parsed.data.entryId },
    data: {
      status: parsed.data.status,
      submittedAt:
        parsed.data.status === "submitted" || parsed.data.status === "completed"
          ? new Date()
          : null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/cycles");
  revalidatePath(`/admin/cycles/${parsed.data.cycleId}/status`);
  revalidatePath(`/admin/cycles/${parsed.data.cycleId}/preview`);
  revalidatePath(`/director/cycles/${parsed.data.cycleId}`);
}
