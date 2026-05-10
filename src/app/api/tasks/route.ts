import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAuthUser, taskVisibilityScope } from "@/lib/rbac";
import { mailFireAndForget, notifyUserAppEmail } from "@/lib/notify-email";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const projectId = searchParams.get("projectId");
    const view = searchParams.get("view"); // "my" for assigned to me

    const where: Record<string, unknown> = {
      ...taskVisibilityScope(user),
    };

    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (view === "my") where.assigneeId = user.id;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, logs: true } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 100,
    });

    const formatted = tasks.map((t) => ({
      ...t,
      tags: t.tags.map((tt) => tt.tag),
    }));

    return NextResponse.json({ tasks: formatted, total: formatted.length });
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      projectId,
      assigneeId,
      dueDate,
      startDate,
      estimatedMinutes,
      category,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const companyId: string | null = user.companyId ?? null;

    const maxPosWhere: Prisma.TaskWhereInput = companyId
      ? { companyId }
      : { creatorId: user.id, companyId: null };

    const maxPos = await prisma.task.findFirst({
      where: maxPosWhere,
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        companyId,
        creatorId: user.id,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        category: category || null,
        position: (maxPos?.position || 0) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
      },
    });

    // Notify assignee
    if (assigneeId && assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: "TASK_ASSIGNED",
          title: "New Task Assigned",
          message: `"${title}" has been assigned to you`,
          isRead: false,
        },
      });
      mailFireAndForget(
        notifyUserAppEmail(
          assigneeId,
          "New task assigned",
          `"${title}" has been assigned to you.`,
          `/tasks`,
        ),
      );
    }

    // Activity log (use task company; super-admin may not have user.companyId)
    if (companyId) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          companyId,
          entityType: "TASK",
          entityId: task.id,
          action: "CREATED",
          details: { title },
        },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
