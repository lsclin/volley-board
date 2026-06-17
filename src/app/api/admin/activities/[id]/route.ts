import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { updateActivitySchema } from "@/lib/validators";
import { computeCounts } from "@/lib/attendance";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const data = updateActivitySchema.parse(body);

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "活动不存在" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startAt !== undefined) updateData.startAt = new Date(data.startAt);
    if (data.endAt !== undefined) updateData.endAt = new Date(data.endAt);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.visible !== undefined) updateData.visible = data.visible;
    if (data.manualExpectedDelta !== undefined)
      updateData.manualExpectedDelta = data.manualExpectedDelta;
    if (data.manualArrivedDelta !== undefined)
      updateData.manualArrivedDelta = data.manualArrivedDelta;

    const activity = await prisma.activity.update({
      where: { id },
      data: updateData,
      include: { attendances: true },
    });

    const { expectedCount, arrivedCount } = computeCounts(
      activity.attendances,
      activity.manualExpectedDelta,
      activity.manualArrivedDelta,
    );

    return Response.json({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      startAt: activity.startAt,
      endAt: activity.endAt,
      location: activity.location,
      note: activity.note,
      status: activity.status,
      visible: activity.visible,
      manualExpectedDelta: activity.manualExpectedDelta,
      manualArrivedDelta: activity.manualArrivedDelta,
      peakArrivedCount: activity.peakArrivedCount,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      expectedCount,
      arrivedCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to update activity:", error);
    return Response.json({ error: "更新活动失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.activity.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "活动不存在" }, { status: 404 });
    }

    if (existing.status === "live") {
      return Response.json(
        { error: "进行中的活动不能删除，请先结束或取消活动" },
        { status: 400 },
      );
    }

    await prisma.activity.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to delete activity:", error);
    return Response.json({ error: "删除活动失败" }, { status: 500 });
  }
}
