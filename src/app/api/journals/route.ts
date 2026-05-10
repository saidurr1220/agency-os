import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const journals = await prisma.journal.findMany({
      where: {
        userId: user.id,
        ...(user.companyId ? { companyId: user.companyId } : {}),
      },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json({ journals });
  } catch (error) {
    console.error("Journals GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch journals" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { summary, completedItems, blockers, tomorrowPlan, mood, productivityScore } = body;

    if (!summary) {
      return NextResponse.json(
        { error: "Summary is required" },
        { status: 400 }
      );
    }

    // Use companyId or "personal" for general users
    const companyId = user.companyId || "personal";

    // Upsert journal for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const journal = await prisma.journal.upsert({
      where: {
        userId_companyId_date: {
          userId: user.id,
          companyId,
          date: today,
        },
      },
      update: {
        summary,
        completedItems: completedItems || [],
        blockers: blockers || [],
        tomorrowPlan: tomorrowPlan || [],
        mood: mood || null,
        productivityScore: productivityScore || null,
      },
      create: {
        userId: user.id,
        companyId,
        date: today,
        summary,
        completedItems: completedItems || [],
        blockers: blockers || [],
        tomorrowPlan: tomorrowPlan || [],
        mood: mood || null,
        productivityScore: productivityScore || null,
      },
    });

    return NextResponse.json({ journal }, { status: 201 });
  } catch (error) {
    console.error("Journals POST error:", error);
    return NextResponse.json(
      { error: "Failed to create journal" },
      { status: 500 }
    );
  }
}
