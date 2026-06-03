import { prisma } from "@/lib/db";

export async function getHistoryStats() {
  const endedActivities = await prisma.activity.findMany({
    where: { status: "ended" },
    include: { attendances: true },
    orderBy: { endAt: "desc" },
  });

  const totalActivities = endedActivities.length;

  const totalArrived = endedActivities.reduce((sum, a) => {
    const arrived = a.attendances.filter(
      (att) => att.status === "arrived",
    ).length;
    return sum + arrived;
  }, 0);

  const avgArrived = totalActivities > 0
    ? Math.round((totalArrived / totalActivities) * 10) / 10
    : 0;

  const locationCounts = new Map<string, number>();
  for (const a of endedActivities) {
    locationCounts.set(a.location, (locationCounts.get(a.location) || 0) + 1);
  }
  let topLocation = "";
  let topLocationCount = 0;
  for (const [loc, count] of locationCounts) {
    if (count > topLocationCount) {
      topLocation = loc;
      topLocationCount = count;
    }
  }

  const hourCounts = new Map<number, number>();
  for (const a of endedActivities) {
    const hour = new Date(a.startAt).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  let topHour = 0;
  let topHourCount = 0;
  for (const [h, count] of hourCounts) {
    if (count > topHourCount) {
      topHour = h;
      topHourCount = count;
    }
  }

  return {
    totalActivities,
    avgArrived,
    topLocation,
    topLocationCount,
    topHour,
    topHourCount,
    activities: endedActivities.map((a) => ({
      id: a.id,
      title: a.title,
      startAt: a.startAt,
      endAt: a.endAt,
      location: a.location,
      note: a.note,
      expectedCount:
        a.attendances.filter(
          (att) => att.status === "expected" || att.status === "arrived",
        ).length + a.manualExpectedDelta,
      arrivedCount:
        a.attendances.filter((att) => att.status === "arrived").length +
        a.manualArrivedDelta,
      peakArrivedCount: a.peakArrivedCount,
    })),
  };
}