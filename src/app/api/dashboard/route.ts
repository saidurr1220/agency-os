import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Build where clause based on user context
    const companyWhere = user.companyId
      ? { companyId: user.companyId }
      : { creatorId: user.id };

    const myWhere = user.companyId
      ? { companyId: user.companyId, assigneeId: user.id }
      : { creatorId: user.id };

    // Fetch stats in parallel
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      todayCompleted,
      todayTotal,
      myTasks,
      recentTasks,
      recentProjects,
    ] = await Promise.all([
      // Total tasks
      prisma.task.count({ where: companyWhere }),

      // Completed tasks
      prisma.task.count({
        where: { ...companyWhere, status: "COMPLETED" },
      }),

      // In progress tasks
      prisma.task.count({
        where: { ...companyWhere, status: "IN_PROGRESS" },
      }),

      // Overdue tasks
      prisma.task.count({
        where: {
          ...companyWhere,
          status: { notIn: ["COMPLETED", "ON_HOLD"] },
          dueDate: { lt: now },
        },
      }),

      // Today completed
      prisma.task.count({
        where: {
          ...myWhere,
          status: "COMPLETED",
          completedAt: { gte: todayStart },
        },
      }),

      // Today total (due today or completed today)
      prisma.task.count({
        where: {
          ...myWhere,
          OR: [
            { dueDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) } },
            { completedAt: { gte: todayStart } },
          ],
        },
      }),

      // My tasks
      prisma.task.findMany({
        where: {
          ...myWhere,
          status: { notIn: ["COMPLETED"] },
        },
        include: {
          project: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),

      // Recent tasks (all company)
      prisma.task.findMany({
        where: companyWhere,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true, color: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),

      // Recent projects
      prisma.project.findMany({
        where: user.companyId ? { companyId: user.companyId } : { ownerId: user.id },
        include: {
          department: { select: { name: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    // Calculate productivity
    const weeklyCompleted = await prisma.task.count({
      where: {
        ...myWhere,
        status: "COMPLETED",
        completedAt: { gte: weekStart },
      },
    });

    const weeklyCompletionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Streak calculation (consecutive days with completed tasks)
    let streak = 0;
    let checkDate = new Date(todayStart);
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate.getTime() + 86400000);
      const count = await prisma.task.count({
        where: {
          ...myWhere,
          status: "COMPLETED",
          completedAt: { gte: dayStart, lt: dayEnd },
        },
      });
      if (count > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      stats: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        overdueTasks,
        productivityScore: weeklyCompletionRate,
        weeklyCompletionRate,
        todayCompleted,
        todayTotal,
        streak,
      },
      myTasks: myTasks.map((t: any) => ({
        ...t,
        tags: t.tags?.map((tt: any) => tt.tag) || [],
      })),
      recentTasks,
      recentProjects,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
