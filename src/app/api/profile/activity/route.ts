import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/rbac";

export type ProfileActivityItem = {
  kind: "task" | "journal";
  action: string;
  detail: string;
  at: string;
};

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { createdAt: true },
    });

    const companyFilter = authUser.companyId
      ? { companyId: authUser.companyId }
      : { creatorId: authUser.id };

    const [tasks, journals] = await Promise.all([
      prisma.task.findMany({
        where: {
          ...companyFilter,
          OR: [{ assigneeId: authUser.id }, { creatorId: authUser.id }],
        },
        select: {
          title: true,
          status: true,
          updatedAt: true,
          completedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
      prisma.journal.findMany({
        where: { userId: authUser.id },
        select: {
          summary: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

    const taskItems: ProfileActivityItem[] = tasks.map((t) => {
      const at =
        t.status === "COMPLETED" && t.completedAt ? t.completedAt : t.updatedAt;
      const completed = t.status === "COMPLETED";
      return {
        kind: "task",
        action: completed ? "Completed task" : "Updated task",
        detail: t.title,
        at: at.toISOString(),
      };
    });

    const journalItems: ProfileActivityItem[] = journals.map((j) => ({
      kind: "journal",
      action: "Journal entry",
      detail:
        j.summary.length > 120 ? `${j.summary.slice(0, 117)}…` : j.summary,
      at: j.updatedAt.toISOString(),
    }));

    const items = [...taskItems, ...journalItems].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );

    return NextResponse.json({
      userCreatedAt: dbUser?.createdAt?.toISOString() ?? null,
      items: items.slice(0, 15),
    });
  } catch (error) {
    console.error("Profile activity error:", error);
    return NextResponse.json(
      { error: "Failed to load activity" },
      { status: 500 },
    );
  }
}
