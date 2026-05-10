import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, canManageOrgStructure } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId) {
      return NextResponse.json({ designations: [] });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");

    const where: Record<string, string> = { companyId: user.companyId };
    if (departmentId) where.departmentId = departmentId;

    const designations = await prisma.designation.findMany({
      where,
      include: {
        department: { select: { name: true } },
        _count: { select: { users: true } },
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ designations });
  } catch (error) {
    console.error("Designations GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch designations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user?.companyId || !canManageOrgStructure(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, departmentId } = body;

    if (!title || !departmentId) {
      return NextResponse.json(
        { error: "Title and department are required" },
        { status: 400 }
      );
    }

    // Verify department belongs to company
    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId: user.companyId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    const designation = await prisma.designation.create({
      data: {
        title,
        departmentId,
        companyId: user.companyId,
      },
    });

    return NextResponse.json({ designation }, { status: 201 });
  } catch (error) {
    console.error("Designations POST error:", error);
    return NextResponse.json(
      { error: "Failed to create designation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user?.companyId || !canManageOrgStructure(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Designation ID is required" },
        { status: 400 }
      );
    }

    const designation = await prisma.designation.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!designation) {
      return NextResponse.json(
        { error: "Designation not found" },
        { status: 404 }
      );
    }

    await prisma.designation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Designations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete designation" },
      { status: 500 }
    );
  }
}
