import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createMatchSchema } from "@/lib/validators";
import { ZodError } from "zod";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");
    const matches = await prisma.match.findMany({
      where: competitionId ? { competitionId } : undefined,
      include: {
        competition: true,
        teamA: true,
        teamB: true,
        sets: { orderBy: { setNo: "asc" } },
      },
      orderBy: { startAt: "desc" },
    });
    return Response.json(matches);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to fetch matches:", error);
    return Response.json({ error: "获取比赛列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = createMatchSchema.parse(body);

    const [competition, teamA, teamB] = await Promise.all([
      prisma.competition.findUnique({ where: { id: data.competitionId } }),
      prisma.team.findUnique({ where: { id: data.teamAId } }),
      prisma.team.findUnique({ where: { id: data.teamBId } }),
    ]);

    if (!competition) {
      return Response.json({ error: "赛事不存在" }, { status: 404 });
    }
    if (!teamA || !teamB) {
      return Response.json({ error: "队伍不存在" }, { status: 404 });
    }
    if (teamA.id === teamB.id) {
      return Response.json({ error: "比赛双方不能是同一队" }, { status: 400 });
    }
    if (
      teamA.competitionId !== data.competitionId ||
      teamB.competitionId !== data.competitionId
    ) {
      return Response.json(
        { error: "比赛队伍必须属于所选赛事" },
        { status: 400 },
      );
    }

    const match = await prisma.match.create({
      data: {
        competitionId: data.competitionId,
        startAt: data.startAt ? new Date(data.startAt) : null,
        location: data.location,
        teamAId: data.teamAId,
        teamBId: data.teamBId,
        // 有局分 → finished；有时间 → scheduled；都没有 → pending（时间待确认）
        status: data.sets?.length
          ? "finished"
          : data.startAt
            ? "scheduled"
            : "pending",
        note: data.note ?? null,
        sets: data.sets?.length
          ? {
              create: data.sets.map((set) => ({
                setNo: set.setNo,
                scoreA: set.scoreA,
                scoreB: set.scoreB,
              })),
            }
          : undefined,
      },
      include: {
        competition: true,
        teamA: true,
        teamB: true,
        sets: { orderBy: { setNo: "asc" } },
      },
    });

    return Response.json(match, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || "请求格式不正确" },
        { status: 400 },
      );
    }
    console.error("Failed to create match:", error);
    return Response.json({ error: "创建比赛失败" }, { status: 500 });
  }
}
