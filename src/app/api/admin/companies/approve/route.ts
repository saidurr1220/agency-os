import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isSuperAdmin } from "@/lib/rbac";
import { mailFireAndForget, notifyUserAppEmail } from "@/lib/notify-email";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);

    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, action } = body;

    if (!companyId || !action) {
      return NextResponse.json(
        { error: "Company ID and action are required" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      const company = await prisma.company.update({
        where: { id: companyId },
        data: {
          status: "ACTIVE",
          approvedById: user.id,
          approvedAt: new Date(),
        },
      });

      // Notify the company owner
      await prisma.notification.create({
        data: {
          userId: company.ownerId,
          type: "SYSTEM",
          title: "Company Approved",
          message: `Your company "${company.name}" has been approved. You can now start using AgencyOS.`,
          isRead: false,
        },
      });
      mailFireAndForget(
        notifyUserAppEmail(
          company.ownerId,
          "Company approved",
          `Your company "${company.name}" has been approved. You can now sign in to AgencyOS.`,
          `/dashboard`,
        ),
      );

      return NextResponse.json({
        success: true,
        message: "Company approved",
        company,
      });
    }

    if (action === "suspend") {
      const company = await prisma.company.update({
        where: { id: companyId },
        data: { status: "SUSPENDED" },
      });

      await prisma.notification.create({
        data: {
          userId: company.ownerId,
          type: "SYSTEM",
          title: "Company Suspended",
          message: `Your company "${company.name}" has been suspended. Contact support for details.`,
          isRead: false,
        },
      });
      mailFireAndForget(
        notifyUserAppEmail(
          company.ownerId,
          "Company suspended",
          `Your company "${company.name}" has been suspended. Contact support for details.`,
          `/dashboard`,
        ),
      );

      return NextResponse.json({
        success: true,
        message: "Company suspended",
        company,
      });
    }

    if (action === "reactivate") {
      const company = await prisma.company.update({
        where: { id: companyId },
        data: { status: "ACTIVE" },
      });

      await prisma.notification.create({
        data: {
          userId: company.ownerId,
          type: "SYSTEM",
          title: "Company Reactivated",
          message: `Your company "${company.name}" has been reactivated.`,
          isRead: false,
        },
      });
      mailFireAndForget(
        notifyUserAppEmail(
          company.ownerId,
          "Company reactivated",
          `Your company "${company.name}" has been reactivated.`,
          `/dashboard`,
        ),
      );

      return NextResponse.json({
        success: true,
        message: "Company reactivated",
        company,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin approve error:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
