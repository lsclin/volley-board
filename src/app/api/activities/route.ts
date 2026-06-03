import { prisma } from "@/lib/db";
import { computeCounts } from "@/lib/attendance";
import { ActivityStatus } from "@prisma/client";

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        visible: true,
        status: { in: [ActivityStatus.scheduled, ActivityStatus.live] },
      },
      include: {
        attendances: true,
      },
      orderBy: { startAt: "asc" },
    });

    const result = activities.map((activity) => {
      const { expectedCount, arrivedCount } = computeCounts(
        activity.attendances,
        activity.manualExpectedDelta,
        activity.manualArrivedDelta,
      );
      return {
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
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return Response.json({ error: "获取活动失败" }, { status: 500 });
  }
}
