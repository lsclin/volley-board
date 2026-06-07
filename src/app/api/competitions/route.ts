import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        matches: {
          include: { teamA: true, teamB: true, sets: true },
          orderBy: { startAt: "asc" },
        },
        files: true,
      },
      orderBy: { startDate: "desc" },
    });
    return Response.json(competitions);
  } catch (error) {
    console.error("Failed to fetch competitions:", error);
    return Response.json({ error: "获取赛事列表失败" }, { status: 500 });
  }
}