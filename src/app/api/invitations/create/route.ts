import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { mailFireAndForget, sendInvitationEmail } from "@/lib/notify-email";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Verify the session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { companyRef: true },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json(
        { error: "You must be part of a company to invite members" },
        { status: 400 }
      );
    }

    // Only managers, chairmen, admins can invite
    const allowedRoles = ["CHAIRMAN", "MANAGER", "ADMIN", "TEAM_LEADER"];
    if (!allowedRoles.includes(currentUser.companyRole)) {
      return NextResponse.json(
        { error: "You don't have permission to invite members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email: rawEmail, role } = body;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.companyMember.findFirst({
      where: {
        companyId: currentUser.companyId,
        user: { email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "This user is already a team member" },
        { status: 400 }
      );
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        email,
        companyId: currentUser.companyId,
        status: "PENDING",
      },
    });

    if (existingInvite) {
      const companyName =
        currentUser.companyRef?.name || "your organization";
      mailFireAndForget(
        sendInvitationEmail({
          to: email,
          companyName,
          role: existingInvite.role,
          code: existingInvite.code,
          expiresAt: existingInvite.expiresAt,
          invitedByName: currentUser.name,
        }),
      );
      return NextResponse.json({
        success: true,
        code: existingInvite.code,
        message: "An invitation already exists for this email",
      });
    }

    // Generate unique invitation code
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        code,
        companyId: currentUser.companyId,
        role: role || "EMPLOYEE",
        invitedById: currentUser.id,
        status: "PENDING",
        expiresAt,
      },
    });

    // Create notification for the inviter
    await prisma.notification.create({
      data: {
        userId: currentUser.id,
        type: "WORKSPACE_INVITE",
        title: "Invitation Created",
        message: `Invitation code for ${email}: ${code}`,
        isRead: false,
      },
    });

    const companyName = currentUser.companyRef?.name || "your organization";
    mailFireAndForget(
      sendInvitationEmail({
        to: email,
        companyName,
        role: invitation.role,
        code: invitation.code,
        expiresAt: invitation.expiresAt,
        invitedByName: currentUser.name,
      }),
    );

    return NextResponse.json({
      success: true,
      code: invitation.code,
      expiresAt: invitation.expiresAt,
      message: `Invitation code generated. Share it with ${email}.`,
    });
  } catch (error) {
    console.error("Create invitation error:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}
