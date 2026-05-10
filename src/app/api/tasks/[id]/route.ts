import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, taskVisibilityScope } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        ...taskVisibilityScope(user),
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true, email: true } },
        creator: { select: { id: true, name: true, avatar: true, email: true } },
        project: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
        logs: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      task: {
        ...task,
        tags: task.tags.map((tt) => tt.tag),
      },
    });
  } catch (error) {
    console.error("Task GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify access
    const existing = await prisma.task.findFirst({
      where: {
        id,
        ...taskVisibilityScope(user),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Handle status change to COMPLETED
    const updateData: Record<string, unknown> = { ...body };
    if (body.status === "COMPLETED" && existing.status !== "COMPLETED") {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }
    if (body.status && body.status !== "COMPLETED") {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
      },
    });

    // Activity log
    if (existing.companyId) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          companyId: existing.companyId,
          entityType: "TASK",
          entityId: id,
          action: "UPDATED",
          details: body,
        },
      });
    }

    return NextResponse.json({ task: { ...task, tags: task.tags.map((tt) => tt.tag) } });
  } catch (error) {
    console.error("Task PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: {
        id,
        ...taskVisibilityScope(user),
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
