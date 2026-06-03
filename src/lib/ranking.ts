import { prisma } from "@/lib/db";

interface TeamRanking {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
}

export async function computeRankings(): Promise<TeamRanking[]> {
  const finishedMatches = await prisma.match.findMany({
    where: { status: "finished" },
    include: {
      sets: true,
      teamA: true,
      teamB: true,
    },
  });

  const teamMap = new Map<string, TeamRanking>();

  const getTeam = (teamId: string, teamName: string): TeamRanking => {
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        teamId,
        teamName,
        wins: 0,
        losses: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsScored: 0,
        pointsConceded: 0,
      });
    }
    return teamMap.get(teamId)!;
  };

  for (const match of finishedMatches) {
    const teamA = getTeam(match.teamAId, match.teamA.name);
    const teamB = getTeam(match.teamBId, match.teamB.name);

    const setsA = match.sets.filter((s) => s.scoreA > s.scoreB).length;
    const setsB = match.sets.filter((s) => s.scoreB > s.scoreA).length;
    const pointsA = match.sets.reduce((sum, s) => sum + s.scoreA, 0);
    const pointsB = match.sets.reduce((sum, s) => sum + s.scoreB, 0);

    teamA.setsWon += setsA;
    teamA.setsLost += setsB;
    teamA.pointsScored += pointsA;
    teamA.pointsConceded += pointsB;

    teamB.setsWon += setsB;
    teamB.setsLost += setsA;
    teamB.pointsScored += pointsB;
    teamB.pointsConceded += pointsA;

    if (setsA > setsB) {
      teamA.wins++;
      teamA.points += 3;
      teamB.losses++;
    } else {
      teamB.wins++;
      teamB.points += 3;
      teamA.losses++;
    }
  }

  const rankings = Array.from(teamMap.values());

  rankings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.points !== a.points) return b.points - a.points;
    const setDiffA = a.setsWon - a.setsLost;
    const setDiffB = b.setsWon - b.setsLost;
    if (setDiffB !== setDiffA) return setDiffB - setDiffA;
    const pointDiffA = a.pointsScored - a.pointsConceded;
    const pointDiffB = b.pointsScored - b.pointsConceded;
    return pointDiffB - pointDiffA;
  });

  return rankings;
}