import { prisma } from "@/lib/db";

/**
 * 看板首页聚合数据：进行中赛事（含进度与下一场）、近期场地安排
 * （已确认时间的比赛 + 管理员发布的活动）、最新赛果。
 */
export async function GET() {
  try {
    const now = new Date();

    const competitions = await prisma.competition.findMany({
      where: { status: "ongoing" },
      include: {
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
      orderBy: { startDate: "asc" },
    });

    const ongoing = competitions.map((c) => {
      const finished = c.matches.filter((m) => m.status === "finished").length;
      const futureScheduled = c.matches.filter(
        (m) => m.status === "scheduled" && m.startAt && m.startAt > now,
      );
      const pending = c.matches.filter((m) => m.status === "pending");
      const next = futureScheduled[0] ?? pending[0] ?? null;
      return {
        id: c.id,
        name: c.name,
        season: c.season,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        totalMatches: c.matches.length,
        finishedMatches: finished,
        fileCount: c._count.files,
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

    const [upcomingMatches, upcomingActivities, latestResults] =
      await Promise.all([
        prisma.match.findMany({
          where: { status: "scheduled", startAt: { gte: now } },
          include: {
            teamA: { select: { name: true } },
            teamB: { select: { name: true } },
            competition: { select: { id: true, name: true } },
          },
          orderBy: { startAt: "asc" },
          take: 10,
        }),
        prisma.activity.findMany({
          where: {
            visible: true,
            status: { in: ["scheduled", "live"] },
          },
          select: {
            id: true,
            title: true,
            type: true,
            startAt: true,
            endAt: true,
            location: true,
            status: true,
            note: true,
          },
          orderBy: { startAt: "asc" },
          take: 10,
        }),
        prisma.match.findMany({
          where: { status: "finished" },
          include: {
            teamA: { select: { name: true } },
            teamB: { select: { name: true } },
            competition: { select: { id: true, name: true } },
            sets: { orderBy: { setNo: "asc" } },
          },
          orderBy: { startAt: "desc" },
          take: 5,
        }),
      ]);

    return Response.json({
      ongoing,
      upcomingMatches,
      upcomingActivities,
      latestResults,
    });
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return Response.json({ error: "获取看板数据失败" }, { status: 500 });
  }
}
