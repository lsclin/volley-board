import { prisma } from "@/lib/db";
import { attendanceSchema } from "@/lib/validators";
import { computeCounts } from "@/lib/attendance";
import { ActivityStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, status } = attendanceSchema.parse(body);

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { attendances: true },
    });

    if (!activity) {
      return Response.json({ error: "活动不存在" }, { status: 404 });
    }

    const allowedStatuses = [
      ActivityStatus.scheduled,
      ActivityStatus.live,
    ] as string[];

    if (!allowedStatuses.includes(activity.status)) {
      return Response.json({ error: "活动已结束或已取消，无法签到" }, { status: 400 });
    }

    await prisma.attendance.upsert({
      where: {
        activityId_clientId: { activityId: id, clientId },
      },
      update: { status },
      create: { activityId: id, clientId, status },
    });

    const updatedAttendances = await prisma.attendance.findMany({
      where: { activityId: id },
    });

    const { arrivedCount } = computeCounts(
      updatedAttendances,
      activity.manualArrivedDelta,
    );

    if (arrivedCount > activity.peakArrivedCount) {
      await prisma.activity.update({
        where: { id },
        data: { peakArrivedCount: arrivedCount },
      });
    }

    const { expectedCount } = computeCounts(
      updatedAttendances,
      activity.manualExpectedDelta,
      activity.manualArrivedDelta,
    );

    return Response.json({
      success: true,
      expectedCount,
      arrivedCount,
    });
  } catch (error) {
    console.error("Attendance error:", error);
    return Response.json({ error: "签到失败" }, { status: 500 });
  }
}