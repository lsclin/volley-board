import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        teamA: true,
        teamB: true,
        competition: { select: { id: true, name: true } },
        sets: { orderBy: { setNo: "asc" } },
      },
    });

    if (!match) {
      return Response.json({ error: "比赛不存在" }, { status: 404 });
    }

    return Response.json(match);
  } catch (error) {
    console.error("Failed to fetch match:", error);
    return Response.json({ error: "获取比赛详情失败" }, { status: 500 });
  }
}
