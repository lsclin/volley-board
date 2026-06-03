import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createActivitySchema } from "@/lib/validators";
import { computeCounts } from "@/lib/attendance";

export async function GET() {
  try {
    await requireAdmin();
    const activities = await prisma.activity.findMany({
      include: { attendances: true },
      orderBy: { startAt: "desc" },
    });

    const result = activities.map((activity) => {
      const { expectedCount, arrivedCount } = computeCounts(
        activity.attendances,
        activity.manualExpectedDelta,
        activity.manualArrivedDelta,
      );
      const { attendances, ...rest } = activity;
      return { ...rest, expectedCount, arrivedCount };
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to fetch admin activities:", error);
    return Response.json({ error: "获取活动列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const data = createActivitySchema.parse(body);

    const activity = await prisma.activity.create({
      data: {
        title: data.title ?? "今晚野球",
        type: data.type ?? "pickup",
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        location: data.location,
        note: data.note ?? null,
        visible: data.visible ?? true,
      },
    });

    const activityWithCounts = {
      ...activity,
      expectedCount: 0,
      arrivedCount: 0,
    };

    return Response.json(activityWithCounts, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "未登录" }, { status: 401 });
    }
    console.error("Failed to create activity:", error);
    return Response.json({ error: "创建活动失败" }, { status: 500 });
  }
}