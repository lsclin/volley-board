import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: {
        teamA: true,
        teamB: true,
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