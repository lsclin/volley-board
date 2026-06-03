import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createMatchSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
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

    const match = await prisma.match.create({
      data: {
        startAt: new Date(data.startAt),
        location: data.location,
        teamAId: data.teamAId,
        teamBId: data.teamBId,
        note: data.note ?? null,
      },
      include: {
        teamA: true,
        teamB: true,
        sets: true,
      },
    });

    return Response.json(match, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to create match:", error);
    return Response.json({ error: "创建比赛失败" }, { status: 500 });
  }
}