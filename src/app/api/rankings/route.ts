import { computeRankings } from "@/lib/ranking";

export async function GET() {
  try {
    const rankings = await computeRankings();
    return Response.json(rankings);
  } catch (error) {
    console.error("Failed to fetch rankings:", error);
    return Response.json({ error: "获取排名失败" }, { status: 500 });
  }
}