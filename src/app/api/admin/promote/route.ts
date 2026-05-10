import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/admin/promote - Promote a user to SUPER_ADMIN
// This is a one-time bootstrap endpoint. In production, this should be
// protected or removed after initial setup.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, secret } = body;

    // Simple secret check for bootstrap
    if (secret !== process.env.BETTER_AUTH_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { systemRole: "SUPER_ADMIN" },
    });

    return NextResponse.json({
      success: true,
      message: `${email} is now a SUPER_ADMIN`,
    });
  } catch (error) {
    console.error("Promote error:", error);
    return NextResponse.json(
      { error: "Failed to promote user" },
      { status: 500 }
    );
  }
}
