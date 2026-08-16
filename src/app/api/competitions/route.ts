import { prisma } from "@/lib/db";

/**
 * 赛事列表（轻量）：为每个赛事附带进度与下一场信息，
 * 供 /schedule 列表页与看板使用。
 */
export async function GET() {
  try {
    const now = new Date();

    const competitions = await prisma.competition.findMany({
      include: {
        teams: { select: { id: true } },
        matches: {
          select: {
            id: true,
            status: true,
            startAt: true,
            teamA: { select: { name: true } },
            teamB: { select: { name: true } },
          },
          orderBy: { startAt: "asc" },
        },
        _count: { select: { files: true } },
      },
      orderBy: { startDate: "desc" },
    });

    const items = competitions.map((c) => {
      const finished = c.matches.filter((m) => m.status === "finished").length;
      const futureScheduled = c.matches.filter(
        (m) => m.status === "scheduled" && m.startAt && m.startAt > now,
      );
      const pending = c.matches.filter((m) => m.status === "pending");
      const next = futureScheduled[0] ?? pending[0] ?? null;
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        season: c.season,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        teamCount: c.teams.length,
        fileCount: c._count.files,
        totalMatches: c.matches.length,
        finishedMatches: finished,
        nextMatch: next
          ? {
              id: next.id,
              startAt: next.startAt,
              teamAName: next.teamA.name,
              teamBName: next.teamB.name,
              status: next.status,
            }
          : null,
      };
    });

    return Response.json(items);
  } catch (error) {
    console.error("Failed to fetch competitions:", error);
    return Response.json({ error: "获取赛事列表失败" }, { status: 500 });
  }
}
