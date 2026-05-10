import { NextResponse } from "next/server";
import type { TaskPriority, TaskStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

/** Prisma `groupBy` row shape when counting by status/priority */
type StatusGroupRow = {
  status: TaskStatus;
  _count: { _all: number };
};

type PriorityGroupRow = {
  priority: TaskPriority;
  _count: { _all: number };
};

/** Matches `journal.findMany({ select: { productivityScore, date } })` */
type JournalWeekRow = {
  productivityScore: number | null;
  date: Date;
};

/** Matches task `findMany` select used for daily buckets / productivity trend */
type TaskRangeRow = {
  status: TaskStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  actualMinutes: number | null;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayRange(dayStart: Date) {
  const next = new Date(dayStart.getTime() + 86400000);
  return { gte: dayStart, lt: next } as const;
}

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 30);

    const companyWhere = user.companyId
      ? { companyId: user.companyId }
      : { creatorId: user.id };

    const myWhere = user.companyId
      ? { companyId: user.companyId, assigneeId: user.id }
      : { creatorId: user.id };

    const rangeStart = new Date(todayStart);
    rangeStart.setDate(rangeStart.getDate() - 6);

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      todayCompleted,
      todayTotal,
      statusGroups,
      priorityGroups,
      tasksForRange,
      weeklyCompletedCount,
      monthCompletedCount,
      streak,
      journalsWeek,
    ] = await Promise.all([
      prisma.task.count({ where: companyWhere }),
      prisma.task.count({
        where: { ...companyWhere, status: "COMPLETED" },
      }),
      prisma.task.count({
        where: {
          ...companyWhere,
          status: { notIn: ["COMPLETED", "ON_HOLD"] },
          dueDate: { lt: now },
        },
      }),
      prisma.task.count({
        where: {
          ...myWhere,
          status: "COMPLETED",
          completedAt: { gte: todayStart },
        },
      }),
      prisma.task.count({
        where: {
          ...myWhere,
          OR: [
            {
              dueDate: {
                gte: todayStart,
                lt: new Date(todayStart.getTime() + 86400000),
              },
            },
            { completedAt: { gte: todayStart } },
          ],
        },
      }),
      prisma.task.groupBy({
        by: ["status"],
        where: companyWhere,
        _count: { _all: true },
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: companyWhere,
        _count: { _all: true },
      }),
      prisma.task.findMany({
        where: {
          ...myWhere,
          OR: [
            { completedAt: { gte: rangeStart } },
            { createdAt: { gte: rangeStart } },
          ],
        },
        select: {
          status: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
          actualMinutes: true,
        },
      }),
      prisma.task.count({
        where: {
          ...myWhere,
          status: "COMPLETED",
          completedAt: { gte: weekStart },
        },
      }),
      prisma.task.count({
        where: {
          ...myWhere,
          status: "COMPLETED",
          completedAt: { gte: monthStart },
        },
      }),
      (async () => {
        let streak = 0;
        let checkDate = new Date(todayStart);
        for (let i = 0; i < 30; i++) {
          const dr = dayRange(checkDate);
          const count = await prisma.task.count({
            where: {
              ...myWhere,
              status: "COMPLETED",
              completedAt: dr,
            },
          });
          if (count > 0) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      })(),
      prisma.journal.findMany({
        where: {
          userId: user.id,
          date: { gte: weekStart },
        },
        select: { productivityScore: true, date: true },
      }),
    ]);

    const productivityScore =
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;
    const weeklyCompletionRate = productivityScore;

    const pendingTasks = totalTasks - completedTasks;

    const dailyBuckets: {
      completed: number;
      created: number;
      timeSpent: number;
      label: string;
      dayStart: Date;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(todayStart);
      dayStart.setDate(dayStart.getDate() - i);
      dailyBuckets.push({
        completed: 0,
        created: 0,
        timeSpent: 0,
        label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        dayStart,
      });
    }

    const dayKey = (t: Date) =>
      startOfDay(t).getTime();

    for (const t of tasksForRange as TaskRangeRow[]) {
      if (t.completedAt && t.status === "COMPLETED") {
        const k = dayKey(t.completedAt);
        const bucket = dailyBuckets.find(
          (b) => dayKey(b.dayStart) === k,
        );
        if (bucket) {
          bucket.completed++;
          bucket.timeSpent += t.actualMinutes ?? 0;
        }
      }
      if (t.createdAt >= rangeStart) {
        const k = dayKey(t.createdAt);
        const bucket = dailyBuckets.find(
          (b) => dayKey(b.dayStart) === k,
        );
        if (bucket) bucket.created++;
      }
    }

    const dailyData = dailyBuckets.map((b) => ({
      date: b.label,
      completed: b.completed,
      created: b.created,
      timeSpent: b.timeSpent,
    }));

    const statusTotal = statusGroups.reduce(
      (sum: number, g: StatusGroupRow) => sum + g._count._all,
      0,
    );
    const statusDistribution = statusGroups.map((g: StatusGroupRow) => ({
      status: g.status,
      count: g._count._all,
      percentage:
        statusTotal > 0
          ? Math.round((g._count._all / statusTotal) * 100)
          : 0,
    }));

    const priorityDistribution = priorityGroups.map((g: PriorityGroupRow) => ({
      priority: g.priority,
      count: g._count._all,
    }));

    const weeklyTrend: { week: string; tasks: number; hours: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const ws = new Date(todayStart);
      ws.setDate(ws.getDate() - (w + 1) * 7);
      const we = new Date(ws.getTime() + 7 * 86400000);
      const [weekTasks, minutesAgg] = await Promise.all([
        prisma.task.count({
          where: {
            ...myWhere,
            status: "COMPLETED",
            completedAt: { gte: ws, lt: we },
          },
        }),
        prisma.task.aggregate({
          where: {
            ...myWhere,
            status: "COMPLETED",
            completedAt: { gte: ws, lt: we },
          },
          _sum: { actualMinutes: true },
        }),
      ]);
      weeklyTrend.push({
        week: `Week ${4 - w}`,
        tasks: weekTasks,
        hours: Math.round(((minutesAgg._sum.actualMinutes ?? 0) / 60) * 10) / 10,
      });
    }

    const openAssigned = await prisma.task.count({
      where: {
        ...myWhere,
        status: { not: "COMPLETED" },
      },
    });

    const rateAgainstOpen = (completed: number) =>
      completed + openAssigned > 0
        ? Math.round((100 * completed) / (completed + openAssigned))
        : completed > 0
          ? 100
          : 0;

    const thisWeekRate = rateAgainstOpen(weeklyCompletedCount);
    const thisMonthRate = rateAgainstOpen(monthCompletedCount);

    const allTimeRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const journalScores = journalsWeek
      .map((j: JournalWeekRow) => j.productivityScore)
      .filter(
        (s: number | null | undefined): s is number =>
          s != null && !Number.isNaN(s),
      );
    const avgJournal =
      journalScores.length > 0
        ? Math.round(
          journalScores.reduce((a: number, b: number) => a + b, 0) /
          journalScores.length,
        )
        : productivityScore;

    const productivityTrend = dailyBuckets.map((b) => {
      const dayTasks = (tasksForRange as TaskRangeRow[]).filter((t: TaskRangeRow) => {
        if (t.status !== "COMPLETED" || !t.completedAt) return false;
        return dayKey(t.completedAt) === dayKey(b.dayStart);
      }).length;
      return {
        date: b.dayStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        score: Math.min(100, avgJournal || productivityScore || dayTasks * 15),
        tasks: dayTasks,
      };
    });

    return NextResponse.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        productivityScore,
        weeklyCompletionRate,
        todayCompleted,
        todayTotal,
        streak,
      },
      dailyData,
      weeklyTrend,
      statusDistribution,
      priorityDistribution,
      productivityTrend,
      completionRates: {
        thisWeek: thisWeekRate,
        thisMonth: thisMonthRate,
        allTime: allTimeRate,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}
