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
      const { attendances, ...rest } = activity;
      return {
        ...rest,
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