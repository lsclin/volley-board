import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsedLimit = Number(searchParams.get("limit") || 3);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 10)
      : 3;

    const matches = await prisma.match.findMany({
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
