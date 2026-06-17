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
    const nextCompetitionId =
      matchData.competitionId !== undefined
        ? matchData.competitionId || null
        : existing.competitionId;
    const nextTeamAId = matchData.teamAId ?? existing.teamAId;
    const nextTeamBId = matchData.teamBId ?? existing.teamBId;
    const shouldValidateTeamScope =
      matchData.competitionId !== undefined ||
      matchData.teamAId !== undefined ||
      matchData.teamBId !== undefined;

    if (nextTeamAId === nextTeamBId) {
      return Response.json({ error: "比赛双方不能是同一队" }, { status: 400 });
    }

    if (nextCompetitionId && shouldValidateTeamScope) {
      const [competition, teamA, teamB] = await Promise.all([
        prisma.competition.findUnique({ where: { id: nextCompetitionId } }),
        prisma.team.findUnique({ where: { id: nextTeamAId } }),
        prisma.team.findUnique({ where: { id: nextTeamBId } }),
      ]);

      if (!competition) {
        return Response.json({ error: "赛事不存在" }, { status: 404 });
      }
      if (!teamA || !teamB) {
        return Response.json({ error: "队伍不存在" }, { status: 404 });
      }
      if (
        teamA.competitionId !== nextCompetitionId ||
        teamB.competitionId !== nextCompetitionId
      ) {
        return Response.json(
          { error: "比赛队伍必须属于所选赛事" },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (matchData.startAt !== undefined) updateData.startAt = new Date(matchData.startAt);
    if (matchData.location !== undefined) updateData.location = matchData.location;
    if (matchData.teamAId !== undefined) updateData.teamAId = matchData.teamAId;
    if (matchData.teamBId !== undefined) updateData.teamBId = matchData.teamBId;
    if (matchData.competitionId !== undefined)
      updateData.competitionId = matchData.competitionId || null;
    if (matchData.status !== undefined) updateData.status = matchData.status;
    if (matchData.note !== undefined) updateData.note = matchData.note;
    if (sets !== undefined && matchData.status === undefined) {
      updateData.status = sets.length > 0 ? "finished" : "scheduled";
    }

    await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        competition: true,
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
        competition: true,
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
