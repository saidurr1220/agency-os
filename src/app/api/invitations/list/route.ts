import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser?.companyId) {
      return NextResponse.json({ invitations: [] });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        companyId: currentUser.companyId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("List invitations error:", error);
    return NextResponse.json(
      { error: "Failed to list invitations" },
      { status: 500 }
    );
  }
}
