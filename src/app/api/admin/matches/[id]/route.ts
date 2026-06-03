import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updateMatchSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = updateMatchSchema.parse(body);

    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "比赛不存在" }, { status: 404 });
    }

    const { sets, ...matchData } = data;
    const updateData: Record<string, unknown> = {};

    if (matchData.startAt !== undefined) updateData.startAt = new Date(matchData.startAt);
    if (matchData.location !== undefined) updateData.location = matchData.location;
    if (matchData.teamAId !== undefined) updateData.teamAId = matchData.teamAId;
    if (matchData.teamBId !== undefined) updateData.teamBId = matchData.teamBId;
    if (matchData.status !== undefined) updateData.status = matchData.status;
    if (matchData.note !== undefined) updateData.note = matchData.note;

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        teamA: true,
        teamB: true,
        sets: { orderBy: { setNo: "asc" } },
      },
    });

    if (sets) {
      await prisma.matchSet.deleteMany({ where: { matchId: id } });
      for (const set of sets) {
        await prisma.matchSet.create({
          data: {
            matchId: id,
            setNo: set.setNo,
            scoreA: set.scoreA,
            scoreB: set.scoreB,
          },
        });
      }
    }

    const updated = await prisma.match.findUnique({
      where: { id },
      include: {
        teamA: true,
        teamB: true,
        sets: { orderBy: { setNo: "asc" } },
      },
    });

    return Response.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to update match:", error);
    return Response.json({ error: "更新比赛失败" }, { status: 500 });
  }
}