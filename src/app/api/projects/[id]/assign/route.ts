import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isManager } from "@/lib/rbac";
import { mailFireAndForget, notifyUserAppEmail } from "@/lib/notify-email";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify user belongs to company
    const targetUser = await prisma.companyMember.findFirst({
      where: { userId, companyId: user.companyId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User is not a member of this company" },
        { status: 400 }
      );
    }

    // Create or update assignment
    const assignment = await prisma.projectAssignment.upsert({
      where: {
        projectId_userId: { projectId, userId },
      },
      update: { role: role || "MEMBER" },
      create: {
        projectId,
        userId,
        role: role || "MEMBER",
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
      },
    });

    // Notify the assigned user
    await prisma.notification.create({
      data: {
        userId,
        type: "PROJECT_ASSIGNED",
        title: "Project Assignment",
        message: `You have been assigned to "${project.name}" as ${role || "MEMBER"}`,
        isRead: false,
      },
    });
    mailFireAndForget(
      notifyUserAppEmail(
        userId,
        "Project assignment",
        `You have been assigned to "${project.name}" as ${role || "MEMBER"}.`,
        `/projects/${projectId}`,
      ),
    );

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        entityType: "PROJECT",
        entityId: projectId,
        action: "MEMBER_ASSIGNED",
        details: { assignedUserId: userId, role: role || "MEMBER" },
      },
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Project assign error:", error);
    return NextResponse.json(
      { error: "Failed to assign member" },
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
    if (!user?.companyId || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await prisma.projectAssignment.deleteMany({
      where: { projectId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project unassign error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
