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
    if (matchCount > 0) {
      return Response.json(
        { error: `该队伍已关联 ${matchCount} 场比赛，不能删除` },
        { status: 400 },
      );
    }

    await prisma.team.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to delete team:", error);
    return Response.json({ error: "删除队伍失败" }, { status: 500 });
  }
}
