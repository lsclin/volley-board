import { prisma } from "@/lib/db";
import { getActivityCountMap } from "@/lib/activityCounts";
import { ActivityStatus } from "@prisma/client";

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      where: {
        visible: true,
        status: { in: [ActivityStatus.scheduled, ActivityStatus.live] },
      },
      orderBy: { startAt: "asc" },
    });
    const countMap = await getActivityCountMap(activities);

    const result = activities.map((activity) => {
      const counts = countMap.get(activity.id) ?? {
        expectedCount: activity.manualExpectedDelta,
        arrivedCount: activity.manualArrivedDelta,
      };
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
        expectedCount: counts.expectedCount,
        arrivedCount: counts.arrivedCount,
      };
    });

    return Response.json(result);
  } catch (error) {
    console.error("Failed to fetch activities:", error);
    return Response.json({ error: "获取活动失败" }, { status: 500 });
  }
}
