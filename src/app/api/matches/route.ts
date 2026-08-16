import { prisma } from "@/lib/db";
import { MatchStatus } from "@prisma/client";

/**
 * 公开比赛列表。支持 ?competitionId=、?status= 筛选与 ?limit=（默认 10，上限 50）。
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");
    const status = searchParams.get("status");
    const parsedLimit = Number(searchParams.get("limit") || 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 10;

    const validStatuses = new Set<string>(Object.values(MatchStatus));
    const where: {
      competitionId?: string;
      status?: MatchStatus;
    } = {};
    if (competitionId) where.competitionId = competitionId;
    if (status && validStatuses.has(status)) where.status = status as MatchStatus;

    const matches = await prisma.match.findMany({
      where,
      take: limit,
      include: {
        teamA: true,
        teamB: true,
        competition: true,
        sets: { orderBy: { setNo: "asc" } },
      },
      orderBy: { startAt: "desc" },
    });
    return Response.json(matches);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return Response.json({ error: "获取比赛列表失败" }, { status: 500 });
  }
}
