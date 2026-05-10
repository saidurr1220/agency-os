import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";
import { mailFireAndForget, notifyUserAppEmail } from "@/lib/notify-email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_REVIEW: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  IN_PROGRESS: ["WAITING_CLIENT", "REVISION", "QA_TESTING", "ON_HOLD", "EXTENDED"],
  WAITING_CLIENT: ["IN_PROGRESS", "ON_HOLD"],
  REVISION: ["IN_PROGRESS", "QA_TESTING"],
  QA_TESTING: ["IN_PROGRESS", "DELIVERED"],
  DELIVERED: [],
  EXTENDED: ["IN_PROGRESS"],
  ON_HOLD: ["IN_PROGRESS", "CANCELLED"],
  CANCELLED: [],
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { status: newStatus, reason } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[project.projectStatus] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${project.projectStatus} to ${newStatus}`,
          allowed,
        },
        { status: 400 }
      );
    }

    // Update project status
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { projectStatus: newStatus },
    });

    // If delivered, create delivery record
    if (newStatus === "DELIVERED") {
      await prisma.deliveryRecord.create({
        data: {
          projectId,
          deliveredById: user.id,
          finalValue: project.orderValue || 0,
          notes: reason,
        },
      });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        entityType: "PROJECT",
        entityId: projectId,
        action: "STATUS_CHANGED",
        details: {
          from: project.projectStatus,
          to: newStatus,
          reason,
        },
      },
    });

    // Notify project members
    const assignments = await prisma.projectAssignment.findMany({
      where: { projectId },
    });

    for (const assignment of assignments) {
      if (assignment.userId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: assignment.userId,
            type: "PROJECT_ASSIGNED",
            title: "Project Status Updated",
            message: `"${project.name}" status changed to ${newStatus}`,
            isRead: false,
          },
        });
        mailFireAndForget(
          notifyUserAppEmail(
            assignment.userId,
            "Project status updated",
            `"${project.name}" status changed to ${newStatus}.`,
            `/projects/${projectId}`,
          ),
        );
      }
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Project status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
