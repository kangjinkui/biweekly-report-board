type GamifiedEntry = {
  status: string;
  submittedAt: Date | null;
  workItems: { id: string }[];
  cycle: {
    startDate: Date;
    dueDate: Date;
  };
};

type GaugeEntry = {
  status: string;
};

export type ReportBadge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
};

export type ReportLevelProfile = {
  level: number;
  title: string;
  points: number;
  currentLevelPoints: number;
  nextLevelPoints: number;
  progressPercent: number;
  submittedCount: number;
  streakCount: number;
  workItemCount: number;
  badges: ReportBadge[];
};

export type TeamGauge = {
  submittedCount: number;
  totalCount: number;
  percent: number;
  label: string;
};

const LEVEL_TITLES = [
  "기록 새싹",
  "꾸준한 리포터",
  "마감 수호자",
  "보고 장인",
  "업무 아카이브 마스터",
];

const SUBMITTED_STATUSES = new Set(["submitted", "completed"]);

export function buildReportLevelProfile(entries: GamifiedEntry[]): ReportLevelProfile {
  const submittedEntries = entries.filter((entry) => isSubmitted(entry.status));
  const completedCount = entries.filter((entry) => entry.status === "completed").length;
  const workItemCount = entries.reduce((sum, entry) => sum + entry.workItems.length, 0);
  const onTimeCount = submittedEntries.filter((entry) => isOnTime(entry)).length;
  const streakCount = getSubmissionStreak(entries);
  const points =
    submittedEntries.length * 35 +
    completedCount * 15 +
    workItemCount * 5 +
    onTimeCount * 20 +
    streakCount * 10;
  const level = Math.max(1, Math.floor(points / 100) + 1);
  const currentLevelPoints = (level - 1) * 100;
  const nextLevelPoints = level * 100;
  const progressPercent = Math.min(
    100,
    Math.round(((points - currentLevelPoints) / 100) * 100),
  );

  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    points,
    currentLevelPoints,
    nextLevelPoints,
    progressPercent,
    submittedCount: submittedEntries.length,
    streakCount,
    workItemCount,
    badges: buildBadges({
      submittedCount: submittedEntries.length,
      completedCount,
      workItemCount,
      onTimeCount,
      streakCount,
    }),
  };
}

export function buildTeamGauge(entries: GaugeEntry[]): TeamGauge {
  const totalCount = entries.length;
  const submittedCount = entries.filter((entry) => isSubmitted(entry.status)).length;
  const percent = totalCount === 0 ? 0 : Math.round((submittedCount / totalCount) * 100);

  return {
    submittedCount,
    totalCount,
    percent,
    label: getGaugeLabel(percent),
  };
}

export function isSubmitted(status: string) {
  return SUBMITTED_STATUSES.has(status);
}

function buildBadges(stats: {
  submittedCount: number;
  completedCount: number;
  workItemCount: number;
  onTimeCount: number;
  streakCount: number;
}): ReportBadge[] {
  return [
    {
      id: "first-submit",
      label: "첫 제출",
      description: "보고서를 처음 제출했습니다.",
      earned: stats.submittedCount >= 1,
    },
    {
      id: "steady-reporter",
      label: "꾸준함",
      description: "보고서를 3회 이상 제출했습니다.",
      earned: stats.submittedCount >= 3,
    },
    {
      id: "deadline-keeper",
      label: "마감 수호",
      description: "마감 전 제출 기록이 있습니다.",
      earned: stats.onTimeCount >= 1,
    },
    {
      id: "streak-three",
      label: "연속 기록",
      description: "최근 3회 연속 제출을 달성했습니다.",
      earned: stats.streakCount >= 3,
    },
    {
      id: "detail-master",
      label: "디테일 장인",
      description: "업무 항목을 10개 이상 작성했습니다.",
      earned: stats.workItemCount >= 10,
    },
    {
      id: "closer",
      label: "완료 해결사",
      description: "완료 처리된 보고서가 5개 이상입니다.",
      earned: stats.completedCount >= 5,
    },
  ];
}

function getSubmissionStreak(entries: GamifiedEntry[]) {
  const sortedEntries = [...entries].sort(
    (a, b) => b.cycle.startDate.getTime() - a.cycle.startDate.getTime(),
  );
  let streak = 0;

  for (const entry of sortedEntries) {
    if (!isSubmitted(entry.status)) break;
    streak += 1;
  }

  return streak;
}

function isOnTime(entry: GamifiedEntry) {
  if (!entry.submittedAt) return false;
  const dueDateEnd = new Date(entry.cycle.dueDate);
  dueDateEnd.setHours(23, 59, 59, 999);
  return entry.submittedAt <= dueDateEnd;
}

function getGaugeLabel(percent: number) {
  if (percent >= 100) return "팀 제출 완료";
  if (percent >= 75) return "마감이 가까워졌어요";
  if (percent >= 40) return "좋은 흐름입니다";
  if (percent > 0) return "출발했습니다";
  return "첫 제출을 기다리는 중";
}
