import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createTeamSchema } from "@/lib/validators";

export async function GET() {
  try {
    await requireAdmin();
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
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

    const team = await prisma.team.create({
      data: {
        name: data.name,
        note: data.note ?? null,
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