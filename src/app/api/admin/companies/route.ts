import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isSuperAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const companies = await prisma.company.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            members: true,
            projects: true,
            departments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ companies });
  } catch (error) {
    console.error("Admin companies error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
