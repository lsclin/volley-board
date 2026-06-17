import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        competition: { select: { name: true } },
        _count: {
          select: {
            matchesA: true,
            matchesB: true,
          },
        },
      },
    });

    if (!team) {
      return Response.json({ error: "队伍不存在" }, { status: 404 });
    }

    const matchCount = team._count.matchesA + team._count.matchesB;
    const result = await prisma.$transaction(async (tx) => {
      const matches = await tx.match.findMany({
        where: {
          OR: [{ teamAId: id }, { teamBId: id }],
        },
        select: { id: true },
      });
      const matchIds = matches.map((match) => match.id);

      if (matchIds.length > 0) {
        await tx.matchSet.deleteMany({
          where: { matchId: { in: matchIds } },
        });
        await tx.match.deleteMany({
          where: { id: { in: matchIds } },
        });
      }

      await tx.team.delete({ where: { id } });
      return { deletedMatchCount: matchIds.length };
    });

    return Response.json({
      success: true,
      deletedMatchCount: result.deletedMatchCount,
      message:
        matchCount > 0
          ? `已删除队伍，并同步删除 ${result.deletedMatchCount} 场相关比赛`
          : "已删除队伍",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to delete team:", error);
    return Response.json({ error: "删除队伍失败" }, { status: 500 });
  }
}
