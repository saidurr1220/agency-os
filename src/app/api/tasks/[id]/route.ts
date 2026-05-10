import { NextResponse } from "next/server";
import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser, taskVisibilityScope } from "@/lib/rbac";

const TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "ON_HOLD",
];

const TASK_PRIORITIES: TaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

/** Only allow real Prisma columns; normalize dates so empty strings don't break updates. */
function buildTaskUpdateData(
  body: Record<string, unknown>,
): Prisma.TaskUncheckedUpdateInput {
  const data: Prisma.TaskUncheckedUpdateInput = {};

  if (typeof body.title === "string") {
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (body.description === null || body.description === "") {
      data.description = null;
    } else {
      data.description = String(body.description);
    }
  }

  if (
    typeof body.status === "string" &&
    TASK_STATUSES.includes(body.status as TaskStatus)
  ) {
    data.status = body.status as TaskStatus;
  }

  if (
    typeof body.priority === "string" &&
    TASK_PRIORITIES.includes(body.priority as TaskPriority)
  ) {
    data.priority = body.priority as TaskPriority;
  }

  for (const key of ["dueDate", "startDate"] as const) {
    if (!(key in body)) continue;
    const v = body[key];
    if (v === null || v === "") {
      data[key] = null;
    } else if (typeof v === "string") {
      const d = new Date(v);
      data[key] = Number.isNaN(d.getTime()) ? null : d;
    }
  }

  if (body.estimatedMinutes !== undefined) {
    if (body.estimatedMinutes === null || body.estimatedMinutes === "") {
      data.estimatedMinutes = null;
    } else {
      const n = Number(body.estimatedMinutes);
      data.estimatedMinutes = Number.isFinite(n) ? Math.floor(n) : null;
    }
  }

  if (body.progress !== undefined) {
    const n = Number(body.progress);
    if (Number.isFinite(n)) {
      data.progress = Math.min(100, Math.max(0, Math.round(n)));
    }
  }

  if (body.category !== undefined) {
    if (body.category === null || body.category === "") {
      data.category = null;
    } else {
      data.category = String(body.category);
    }
  }

  if (body.projectId !== undefined) {
    if (body.projectId === null || body.projectId === "") {
      data.projectId = null;
    } else {
      data.projectId = String(body.projectId);
    }
  }

  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null || body.assigneeId === "") {
      data.assigneeId = null;
    } else {
      data.assigneeId = String(body.assigneeId);
    }
  }

  if (body.position !== undefined) {
    const n = Number(body.position);
    if (Number.isFinite(n)) data.position = Math.floor(n);
  }

  return data;
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
    const rawBody = (await request.json()) as Record<string, unknown>;

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

    const updateData = buildTaskUpdateData(rawBody);

    if (typeof rawBody.status === "string") {
      if (
        rawBody.status === "COMPLETED" &&
        existing.status !== "COMPLETED"
      ) {
        updateData.completedAt = new Date();
        if (updateData.progress === undefined) {
          updateData.progress = 100;
        }
      } else if (rawBody.status !== "COMPLETED") {
        updateData.completedAt = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
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
          details: JSON.parse(JSON.stringify(rawBody)) as Prisma.InputJsonValue,
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
