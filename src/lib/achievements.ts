import type { DashboardStats, Task } from "@/types";

/** Typical office desk window (Mon–Fri tasks counted for “desk hours”). */
export const OFFICE_OPEN_HOUR = 9;
export const OFFICE_CLOSE_HOUR = 18;

export interface AchievementDisplay {
  name: string;
  description: string;
  progress: number;
  icon: string;
}

/**
 * Achievements are derived from dashboard stats + completed task timestamps.
 * Office framing matches a 9 AM–6 PM working day; adjust constants if your policy differs.
 */
export function buildAchievements(
  stats: DashboardStats,
  tasks: Task[]
): AchievementDisplay[] {
  const completedWithTime = tasks.filter(
    (t) => t.status === "COMPLETED" && t.completedAt
  );

  const weekdayOfficeCompletions = completedWithTime.filter((t) => {
    const d = new Date(t.completedAt!);
    const day = d.getDay();
    if (day === 0 || day === 6) return false;
    const h = d.getHours();
    return h >= OFFICE_OPEN_HOUR && h < OFFICE_CLOSE_HOUR;
  }).length;

  const earlyStarts = completedWithTime.filter((t) => {
    const h = new Date(t.completedAt!).getHours();
    return h < OFFICE_OPEN_HOUR;
  }).length;

  const officeHourProgress =
    completedWithTime.length === 0
      ? 0
      : Math.round((weekdayOfficeCompletions / completedWithTime.length) * 100);

  const streakProgress = Math.min(100, stats.streak * 14);

  const volumeProgress = Math.min(100, Math.round((stats.completedTasks / 50) * 100));

  return [
    {
      name: "Desk hours hero",
      description: `Close tasks between ${OFFICE_OPEN_HOUR}:00–${OFFICE_CLOSE_HOUR}:00 on weekdays (core office window).`,
      progress: officeHourProgress,
      icon: "🏢",
    },
    {
      name: "Early shift",
      description: `Tasks completed before ${OFFICE_OPEN_HOUR}:00 AM (early bird days).`,
      progress:
        completedWithTime.length === 0
          ? 0
          : Math.min(100, Math.round((earlyStarts / completedWithTime.length) * 100)),
      icon: "🌅",
    },
    {
      name: "Streak",
      description: "Consistent daily completions (same streak as your dashboard).",
      progress: streakProgress,
      icon: "🔥",
    },
    {
      name: "Momentum",
      description: "Total tasks closed — bar fills toward 50 completions.",
      progress: volumeProgress,
      icon: "📈",
    },
    {
      name: "Focus score",
      description: "Matches dashboard productivity %.",
      progress: stats.productivityScore,
      icon: "🎯",
    },
  ];
}
