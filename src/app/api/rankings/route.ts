import { computeRankings, computeRankingsForCompetition } from "@/lib/ranking";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const competitionId = url.searchParams.get("competitionId");

    if (competitionId) {
      const rankings = await computeRankingsForCompetition(competitionId);
      return Response.json(rankings);
    }

    const rankings = await computeRankings();
    return Response.json(rankings);
  } catch (error) {
    console.error("Failed to fetch rankings:", error);
    return Response.json({ error: "获取排名失败" }, { status: 500 });
  }
}