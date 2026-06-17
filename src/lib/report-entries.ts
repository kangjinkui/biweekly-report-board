import { prisma } from "@/lib/prisma";

export async function ensureDraftCycleEntriesForActiveTeams() {
  const [draftCycles, activeTeams] = await Promise.all([
    prisma.reportCycle.findMany({
      where: { status: "draft" },
      select: { id: true },
    }),
    prisma.team.findMany({
      where: { isActive: true },
      select: { id: true },
    }),
  ]);

  if (draftCycles.length === 0 || activeTeams.length === 0) {
    return;
  }

  await prisma.reportEntry.createMany({
    data: draftCycles.flatMap((cycle) =>
      activeTeams.map((team) => ({
        reportCycleId: cycle.id,
        teamId: team.id,
      })),
    ),
    skipDuplicates: true,
  });
}

export async function ensureDraftCycleEntriesForTeam(teamId: string) {
  const draftCycles = await prisma.reportCycle.findMany({
    where: { status: "draft" },
    select: { id: true },
  });

  if (draftCycles.length === 0) {
    return;
  }

  await prisma.reportEntry.createMany({
    data: draftCycles.map((cycle) => ({
      reportCycleId: cycle.id,
      teamId,
    })),
    skipDuplicates: true,
  });
}
