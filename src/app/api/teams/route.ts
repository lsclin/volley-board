import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json(teams);
  } catch (error) {
    console.error("Failed to fetch teams:", error);
    return Response.json({ error: "获取队伍列表失败" }, { status: 500 });
  }
}