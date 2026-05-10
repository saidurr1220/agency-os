import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, canManageOrgStructure } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId) {
      return NextResponse.json({ departments: [] });
    }

    const departments = await prisma.department.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: { select: { users: true, designations: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("Departments GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch departments" },
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
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Department name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.department.findFirst({
      where: {
        name,
        companyId: user.companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Department already exists" },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        companyId: user.companyId,
      },
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error) {
    console.error("Departments POST error:", error);
    return NextResponse.json(
      { error: "Failed to create department" },
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
        { error: "Department ID is required" },
        { status: 400 }
      );
    }

    const department = await prisma.department.findFirst({
      where: { id, companyId: user.companyId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "Department not found" },
        { status: 404 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Departments DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete department" },
      { status: 500 }
    );
  }
}
