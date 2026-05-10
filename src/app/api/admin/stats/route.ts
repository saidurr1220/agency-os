import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isSuperAdmin } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      totalUsers,
      activeUsers,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.company.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      stats: {
        totalCompanies,
        activeCompanies,
        pendingCompanies,
        totalUsers,
        activeUsers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
