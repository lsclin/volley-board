import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updateCompetitionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = updateCompetitionSchema.parse(body);

    const existing = await prisma.competition.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "赛事不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.season !== undefined) updateData.season = data.season;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined)
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined)
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const competition = await prisma.competition.update({
      where: { id },
      data: updateData,
    });

    return Response.json(competition);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to update competition:", error);
    return Response.json({ error: "更新赛事失败" }, { status: 500 });
  }
}