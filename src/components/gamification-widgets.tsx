import { Award, Gauge, Medal, Sparkles } from "lucide-react";
import type { ReportBadge, ReportLevelProfile, TeamGauge } from "@/lib/gamification";

export function ReportLevelCard({ profile }: { profile: ReportLevelProfile }) {
  const earnedBadges = profile.badges.filter((badge) => badge.earned).length;

  return (
    <section className="gov-panel mb-5 overflow-hidden">
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_260px] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center bg-[#e7f1fb] text-[#005bac]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#005bac]">보고 성장 레벨</p>
              <h2 className="text-2xl font-bold text-[#102a43]">
                Lv.{profile.level} {profile.title}
              </h2>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden border border-[#c8d3df] bg-[#f6f9fc]">
            <div
              className="h-full bg-[#0f7dc2]"
              style={{ width: `${profile.progressPercent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-[#667085]">
            {profile.points}점 · 다음 레벨까지{" "}
            {Math.max(0, profile.nextLevelPoints - profile.points)}점
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniStat label="제출" value={`${profile.submittedCount}회`} />
          <MiniStat label="연속" value={`${profile.streakCount}회`} />
          <MiniStat label="뱃지" value={`${earnedBadges}개`} />
        </div>
      </div>
    </section>
  );
}

export function BadgeBoard({ badges }: { badges: ReportBadge[] }) {
  return (
    <section className="gov-panel mb-5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Medal className="h-5 w-5 text-[#005bac]" aria-hidden />
        <h2 className="font-semibold text-[#102a43]">획득 뱃지</h2>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={`border px-3 py-3 ${
              badge.earned
                ? "border-[#8db8dd] bg-[#f6f9fc] text-[#102a43]"
                : "border-[#d6dbe1] bg-white text-[#98a2b3]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Award
                className={`h-4 w-4 ${badge.earned ? "text-[#0f7dc2]" : "text-[#98a2b3]"}`}
                aria-hidden
              />
              <span className="font-semibold">{badge.label}</span>
            </div>
            <p className="mt-1 text-sm leading-5">{badge.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamGaugeCard({
  gauge,
  title = "팀 제출 게이지",
}: {
  gauge: TeamGauge;
  title?: string;
}) {
  return (
    <section className="gov-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-[#005bac]" aria-hidden />
          <div>
            <h2 className="font-semibold text-[#102a43]">{title}</h2>
            <p className="mt-1 text-sm text-[#667085]">{gauge.label}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-[#003f7d]">{gauge.percent}%</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden border border-[#c8d3df] bg-[#f6f9fc]">
        <div className="h-full bg-[#005bac]" style={{ width: `${gauge.percent}%` }} />
      </div>
      <p className="mt-2 text-sm text-[#667085]">
        제출 {gauge.submittedCount}/{gauge.totalCount}
      </p>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#c8d3df] bg-[#f6f9fc] px-3 py-2">
      <p className="text-xs text-[#667085]">{label}</p>
      <p className="mt-1 font-semibold text-[#102a43]">{value}</p>
    </div>
  );
}
