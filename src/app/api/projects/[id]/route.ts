import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        owner: { select: { id: true, name: true, avatar: true, email: true } },
        department: { select: { id: true, name: true } },
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { position: "asc" },
        },
        extensions: {
          orderBy: { createdAt: "desc" },
        },
        clientData: true,
        deliveryRecords: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate task stats
    const taskStats = {
      total: project.tasks.length,
      completed: project.tasks.filter((t) => t.status === "COMPLETED").length,
      inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS")
        .length,
      todo: project.tasks.filter((t) => t.status === "TODO").length,
      review: project.tasks.filter((t) => t.status === "REVIEW").length,
      onHold: project.tasks.filter((t) => t.status === "ON_HOLD").length,
    };

    return NextResponse.json({ project, taskStats });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
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
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify project belongs to company
    const existing = await prisma.project.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: body,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.project.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
