import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, userId } = body;

    if (!code || !userId) {
      return NextResponse.json(
        { error: "Invitation code and user ID are required" },
        { status: 400 }
      );
    }

    // Find the invitation
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

    await prisma.user.update({
      where: { id: userId },
      data: {
        companyId: invitation.companyId,
        companyRole: invitation.role,
      },
    });

    await prisma.companyMember.create({
      data: {
        companyId: invitation.companyId,
        userId: userId,
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
