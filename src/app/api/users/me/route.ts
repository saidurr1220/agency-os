import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyId: true,
        departmentId: true,
        designationId: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/users/me:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: string;
      phone?: string | null;
      departmentId?: string | null;
      designationId?: string | null;
    };

    const updateData: {
      name?: string;
      phone?: string | null;
      departmentId?: string | null;
      designationId?: string | null;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }
    if (body.phone !== undefined) {
      updateData.phone =
        body.phone === null || body.phone === "" ? null : String(body.phone);
    }

    const orgFieldsRequested =
      body.departmentId !== undefined || body.designationId !== undefined;
    if (orgFieldsRequested && !authUser.companyId) {
      return NextResponse.json(
        {
          error:
            "Join a company before setting department or designation.",
        },
        { status: 400 }
      );
    }

    if (body.departmentId !== undefined) {
      if (body.departmentId === null || body.departmentId === "") {
        updateData.departmentId = null;
        updateData.designationId = null;
      } else {
        const dept = await prisma.department.findFirst({
          where: { id: body.departmentId, companyId: authUser.companyId! },
        });
        if (!dept) {
          return NextResponse.json(
            { error: "Invalid department" },
            { status: 400 }
          );
        }
        updateData.departmentId = body.departmentId;
        updateData.designationId = null;
      }
    }

    if (body.designationId !== undefined) {
      if (body.designationId === null || body.designationId === "") {
        updateData.designationId = null;
      } else {
        const des = await prisma.designation.findFirst({
          where: {
            id: body.designationId,
            companyId: authUser.companyId!,
          },
        });
        if (!des) {
          return NextResponse.json(
            { error: "Invalid designation" },
            { status: 400 }
          );
        }
        const effectiveDeptId =
          updateData.departmentId !== undefined
            ? updateData.departmentId
            : (
              await prisma.user.findUnique({
                where: { id: authUser.id },
                select: { departmentId: true },
              })
            )?.departmentId ?? null;

        if (!effectiveDeptId || des.departmentId !== effectiveDeptId) {
          return NextResponse.json(
            {
              error:
                "Pick your department first, then a designation in that department.",
            },
            { status: 400 }
          );
        }
        updateData.designationId = body.designationId;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: authUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        departmentId: true,
        designationId: true,
        department: { select: { id: true, name: true } },
        designation: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("PATCH /api/users/me:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
