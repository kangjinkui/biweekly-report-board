import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateWorkItemSchema = z.object({
  entryId: z.string().uuid(),
  teamId: z.string().uuid(),
  cycleId: z.string().uuid(),
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(5000).default(""),
  nextPlan: z.string().trim().max(5000).default(""),
  note: z.string().trim().max(5000).default(""),
});

type WorkItemRouteContext = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: WorkItemRouteContext) {
  const { itemId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateWorkItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "입력값을 확인해 주세요." },
      { status: 400 },
    );
  }

  const item = await prisma.workItem.findUnique({
    where: { id: itemId },
    select: { reportEntryId: true },
  });

  if (!item || item.reportEntryId !== parsed.data.entryId) {
    return NextResponse.json(
      { ok: false, message: "업무 항목을 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  const [, entry] = await prisma.$transaction([
    prisma.workItem.update({
      where: { id: itemId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        nextPlan: parsed.data.nextPlan,
        note: parsed.data.note,
      },
    }),
    prisma.reportEntry.update({
      where: { id: parsed.data.entryId },
      data: {
        status: "in_progress",
        submittedAt: null,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    }),
  ]);

  revalidatePath(`/write/${parsed.data.teamId}/${parsed.data.cycleId}`);
  revalidatePath("/admin");
  revalidatePath("/admin/cycles");
  revalidatePath(`/admin/cycles/${parsed.data.cycleId}/status`);
  revalidatePath(`/admin/cycles/${parsed.data.cycleId}/preview`);
  revalidatePath(`/director/cycles/${parsed.data.cycleId}`);

  return NextResponse.json({
    ok: true,
    entryStatus: entry.status,
    savedAt: entry.updatedAt.toISOString(),
  });
}
