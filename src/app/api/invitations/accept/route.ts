import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { code?: string };
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { code },
    });

    if (!invitation || invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invalid or used invitation" },
        { status: 400 }
      );
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invitation.email}. Sign in with that account.`,
        },
        { status: 403 }
      );
    }

    if (
      user.companyId &&
      user.companyId !== invitation.companyId
    ) {
      return NextResponse.json(
        {
          error:
            "You're already part of another organization. Leave it before accepting a new invite.",
        },
        { status: 400 }
      );
    }

    const existingMember = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: invitation.companyId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });
      return NextResponse.json({
        success: true,
        message: "You're already a member of this team",
        companyId: invitation.companyId,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyId: invitation.companyId,
        companyRole: invitation.role,
      },
    });

    await prisma.companyMember.create({
      data: {
        companyId: invitation.companyId,
        userId: user.id,
        role: invitation.role,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the team",
      companyId: invitation.companyId,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
