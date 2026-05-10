import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, taskVisibilityScope } from "@/lib/rbac";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const body = await request.json();
    const { content, progressChange, timeSpent } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        ...taskVisibilityScope(user),
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const log = await prisma.taskLog.create({
      data: {
        taskId,
        userId: user.id,
        content,
        progressChange: progressChange ? parseInt(progressChange) : null,
        timeSpent: timeSpent ? parseInt(timeSpent) : null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update task progress if provided
    if (progressChange) {
      const newProgress = Math.min(100, Math.max(0, task.progress + parseInt(progressChange)));
      await prisma.task.update({
        where: { id: taskId },
        data: { progress: newProgress },
      });
    }

    // Update actual minutes if time spent
    if (timeSpent) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          actualMinutes: (task.actualMinutes || 0) + parseInt(timeSpent),
        },
      });
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error("Task log error:", error);
    return NextResponse.json(
      { error: "Failed to add log" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    const logs = await prisma.taskLog.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Task logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}
