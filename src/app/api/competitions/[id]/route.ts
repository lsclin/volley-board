import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const competition = await prisma.competition.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            teamA: true,
            teamB: true,
            sets: { orderBy: { setNo: "asc" } },
          },
          orderBy: { startAt: "asc" },
        },
        files: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!competition) {
      return Response.json({ error: "赛事不存在" }, { status: 404 });
    }

    return Response.json(competition);
  } catch (error) {
    console.error("Failed to fetch competition:", error);
    return Response.json({ error: "获取赛事详情失败" }, { status: 500 });
  }
}
