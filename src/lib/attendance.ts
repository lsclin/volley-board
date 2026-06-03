import { AttendanceStatus } from "@prisma/client";

export function computeCounts(
  attendances: { status: string }[],
  manualExpectedDelta: number = 0,
  manualArrivedDelta: number = 0,
) {
  const expected = attendances.filter(
    (a) => a.status === AttendanceStatus.expected || a.status === AttendanceStatus.arrived,
  ).length;
  const arrived = attendances.filter((a) => a.status === AttendanceStatus.arrived).length;

  return {
    expectedCount: expected + manualExpectedDelta,
    arrivedCount: arrived + manualArrivedDelta,
  };
}