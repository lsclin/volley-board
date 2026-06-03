import { getHistoryStats } from "@/lib/stats";

export async function GET() {
  try {
    const stats = await getHistoryStats();
    return Response.json(stats);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return Response.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}