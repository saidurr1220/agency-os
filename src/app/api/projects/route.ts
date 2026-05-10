import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isManager, isSuperAdmin } from "@/lib/rbac";

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

    const where: Record<string, unknown> = {};
    if (isSuperAdmin(user)) {
      // Platform admin: see all projects (optional company filter via query later).
    } else if (user.companyId) {
      where.companyId = user.companyId;
    } else {
      return NextResponse.json({ projects: [] });
    }
    if (status) where.projectStatus = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
        assignments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user?.companyId || !isManager(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      clientName,
      clientEmail,
      platform,
      orderId,
      orderValue,
      currency,
      priority,
      departmentId,
      deliveryDate,
      estimatedDays,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        companyId: user.companyId,
        ownerId: user.id,
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        platform: platform || null,
        orderId: orderId || null,
        orderValue: orderValue ? parseFloat(orderValue) : null,
        currency: currency || "USD",
        priority: priority || "MEDIUM",
        departmentId: departmentId || null,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        projectStatus: "PENDING_REVIEW",
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Create activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        entityType: "PROJECT",
        entityId: project.id,
        action: "CREATED",
        details: { projectName: name },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
