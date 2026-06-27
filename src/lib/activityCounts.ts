import { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type ActivityCountInput = {
  id: string;
  manualExpectedDelta: number;
  manualArrivedDelta: number;
};

type ActivityCountResult = {
  expectedCount: number;
  arrivedCount: number;
};

export async function getActivityCountMap(
  activities: ActivityCountInput[],
): Promise<Map<string, ActivityCountResult>> {
  const result = new Map<string, ActivityCountResult>();
  if (activities.length === 0) return result;

  const rows = await prisma.attendance.groupBy({
    by: ["activityId", "status"],
    where: {
      activityId: { in: activities.map((activity) => activity.id) },
      status: { in: [AttendanceStatus.expected, AttendanceStatus.arrived] },
    },
    _count: { _all: true },
  });

  const rawCounts = new Map<string, ActivityCountResult>();
  for (const row of rows) {
    const current = rawCounts.get(row.activityId) ?? {
      expectedCount: 0,
      arrivedCount: 0,
    };
    if (row.status === AttendanceStatus.expected) {
      current.expectedCount += row._count._all;
    }
    if (row.status === AttendanceStatus.arrived) {
      current.expectedCount += row._count._all;
      current.arrivedCount += row._count._all;
    }
    rawCounts.set(row.activityId, current);
  }

  for (const activity of activities) {
    const current = rawCounts.get(activity.id) ?? {
      expectedCount: 0,
      arrivedCount: 0,
    };
    result.set(activity.id, {
      expectedCount: current.expectedCount + activity.manualExpectedDelta,
      arrivedCount: current.arrivedCount + activity.manualArrivedDelta,
    });
  }

  return result;
}

export async function getActivityCounts(
  activity: ActivityCountInput,
): Promise<ActivityCountResult> {
  const counts = await getActivityCountMap([activity]);
  return counts.get(activity.id) ?? {
    expectedCount: activity.manualExpectedDelta,
    arrivedCount: activity.manualArrivedDelta,
  };
}
