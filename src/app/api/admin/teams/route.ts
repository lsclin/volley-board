import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get("competitionId");
    const teams = await prisma.team.findMany({
      where: competitionId ? { competitionId } : undefined,
      include: {
        competition: { select: { id: true, name: true } },
        _count: { select: { matchesA: true, matchesB: true } },
      },
      orderBy: [{ competition: { startDate: "desc" } }, { name: "asc" }],
    });
    return Response.json(teams);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to fetch teams:", error);
    return Response.json({ error: "获取队伍列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = createTeamSchema.parse(body);

    const competition = await prisma.competition.findUnique({
      where: { id: data.competitionId },
    });
    if (!competition) {
      return Response.json({ error: "赛事不存在" }, { status: 404 });
    }

    const existingTeams = await prisma.team.findMany({
      where: {
        competitionId: data.competitionId,
      },
    });
    const normalizedName = data.name.trim().replace(/\s+/g, " ").toLowerCase();
    const existing = existingTeams.some(
      (team) => team.name.trim().replace(/\s+/g, " ").toLowerCase() === normalizedName,
    );
    if (existing) {
      return Response.json(
        { error: "该赛事下已经有同名队伍" },
        { status: 400 },
      );
    }

    const team = await prisma.team.create({
      data: {
        competitionId: data.competitionId,
        name: data.name,
        note: data.note ?? null,
      },
      include: {
        competition: { select: { id: true, name: true } },
        _count: { select: { matchesA: true, matchesB: true } },
      },
    });

    return Response.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to create team:", error);
    return Response.json({ error: "创建队伍失败" }, { status: 500 });
  }
}
