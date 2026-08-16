import { computeRankings } from "@/lib/ranking";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const competitionId = url.searchParams.get("competitionId");
    const rankings = await computeRankings(competitionId || undefined);
    return Response.json(rankings);
  } catch (error) {
    console.error("Failed to fetch rankings:", error);
    return Response.json({ error: "获取排名失败" }, { status: 500 });
  }
}
