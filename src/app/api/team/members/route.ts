import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, canManageOrgStructure } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user?.companyId) {
      return NextResponse.json({ members: [] });
    }

    const members = await prisma.companyMember.findMany({
      where: { companyId: user.companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            companyRole: true,
            departmentId: true,
            designationId: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    const formatted = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      memberRole: m.role,
      companyRole: m.user.companyRole,
      departmentId: m.user.departmentId,
      departmentName: m.user.department?.name ?? null,
      designationId: m.user.designationId,
      designationTitle: m.user.designation?.title ?? null,
    }));

    return NextResponse.json({ members: formatted });
  } catch (error) {
    console.error("Team members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.companyId || !canManageOrgStructure(auth)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = (await request.json()) as {
      userId: string;
      departmentId?: string | null;
      designationId?: string | null;
    };

    if (!body.userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const target = await prisma.user.findFirst({
      where: { id: body.userId, companyId: auth.companyId },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const data: {
      departmentId?: string | null;
      designationId?: string | null;
    } = {};

    if (body.departmentId !== undefined) {
      if (body.departmentId === null || body.departmentId === "") {
        data.departmentId = null;
        data.designationId = null;
      } else {
        const dept = await prisma.department.findFirst({
          where: { id: body.departmentId, companyId: auth.companyId },
        });
        if (!dept) {
          return NextResponse.json(
            { error: "Invalid department" },
            { status: 400 }
          );
        }
        data.departmentId = body.departmentId;
        data.designationId = null;
      }
    }

    if (body.designationId !== undefined) {
      if (body.designationId === null || body.designationId === "") {
        data.designationId = null;
      } else {
        const des = await prisma.designation.findFirst({
          where: {
            id: body.designationId,
            companyId: auth.companyId,
          },
        });
        if (!des) {
          return NextResponse.json(
            { error: "Invalid designation" },
            { status: 400 }
          );
        }
        const deptId =
          data.departmentId !== undefined
            ? data.departmentId
            : target.departmentId;
        if (!deptId || des.departmentId !== deptId) {
          return NextResponse.json(
            {
              error:
                "Designation must match the member's department. Set department first.",
            },
            { status: 400 }
          );
        }
        data.designationId = body.designationId;
      }
    }

    const updated = await prisma.user.update({
      where: { id: body.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true,
        designationId: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error("PATCH team member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
