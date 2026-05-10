import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";
import { mailFireAndForget, notifyUserAppEmail } from "@/lib/notify-email";

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
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Verify task access
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        ...(user.companyId ? { companyId: user.companyId } : { creatorId: user.id }),
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: user.id,
        content,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify assignee if different
    if (task.assigneeId && task.assigneeId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          type: "COMMENT_MENTION",
          title: "New Comment",
          message: `${user.name} commented on "${task.title}"`,
          isRead: false,
        },
      });
      mailFireAndForget(
        notifyUserAppEmail(
          task.assigneeId,
          "New comment on your task",
          `${user.name} commented on "${task.title}".`,
          `/tasks`,
        ),
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Task comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
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

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Task comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
