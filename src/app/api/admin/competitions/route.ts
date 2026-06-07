import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createCompetitionSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const competitions = await prisma.competition.findMany({
      include: {
        files: { orderBy: { createdAt: "desc" } },
        _count: { select: { matches: true, files: true } },
      },
      orderBy: { startDate: "desc" },
    });
    return Response.json(competitions);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to fetch competitions:", error);
    return Response.json({ error: "获取赛事列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = createCompetitionSchema.parse(body);

    const competition = await prisma.competition.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        season: data.season ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return Response.json(competition, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to create competition:", error);
    return Response.json({ error: "创建赛事失败" }, { status: 500 });
  }
}
