import { prisma } from "@/lib/db";

export interface TeamRanking {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
  /** 胜负局比 = 胜局 / 负局；负局为 0 且胜局 > 0 时为 null（表示无穷大） */
  setRatio: number | null;
  /** 得失分比 = 总得分 / 总失分；总失分为 0 且总得分 > 0 时为 null（表示无穷大） */
  pointRatio: number | null;
}

type FinishedMatch = {
  teamAId: string;
  teamBId: string;
  teamA: { name: string };
  teamB: { name: string };
  sets: { scoreA: number; scoreB: number }[];
};

const sortRankings = (rankings: TeamRanking[]): TeamRanking[] =>
  rankings.sort((a, b) => {
    // 排球常用排序：胜场 → 积分 → 胜负局比 → 得失分比
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.points !== a.points) return b.points - a.points;
    const setRatioA = a.setRatio ?? Infinity;
    const setRatioB = b.setRatio ?? Infinity;
    if (setRatioB !== setRatioA) return setRatioB - setRatioA;
    const pointRatioA = a.pointRatio ?? Infinity;
    const pointRatioB = b.pointRatio ?? Infinity;
    if (pointRatioB !== pointRatioA) return pointRatioB - pointRatioA;
    return a.teamName.localeCompare(b.teamName, "zh-CN");
  });

/**
 * 计算排名。传入 competitionId 时只统计该赛事且包含 0 战绩队伍（完整积分榜）；
 * 不传时统计全部完赛比赛、仅包含有完赛记录的队伍。
 */
export async function computeRankings(
  competitionId?: string,
): Promise<TeamRanking[]> {
  const where = competitionId
    ? { status: "finished" as const, competitionId }
    : { status: "finished" as const };

  const [finishedMatches, allTeams] = await Promise.all([
    prisma.match.findMany({
      where,
      include: { sets: true, teamA: true, teamB: true },
    }),
    competitionId
      ? prisma.team.findMany({ where: { competitionId } })
      : Promise.resolve(null),
  ]);

  const teamMap = new Map<string, TeamRanking>();

  const getTeam = (teamId: string, teamName: string): TeamRanking => {
    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        teamId,
        teamName,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        pointsScored: 0,
        pointsConceded: 0,
        setRatio: 0,
        pointRatio: 0,
      });
    }
    return teamMap.get(teamId)!;
  };

  // 赛事视角：先放入全部参赛队伍，保证 0 战绩队伍也出现在积分榜
  if (allTeams) {
    for (const team of allTeams) getTeam(team.id, team.name);
  }

  for (const match of finishedMatches as FinishedMatch[]) {
    const teamA = getTeam(match.teamAId, match.teamA.name);
    const teamB = getTeam(match.teamBId, match.teamB.name);

    const setsA = match.sets.filter((s) => s.scoreA > s.scoreB).length;
    const setsB = match.sets.filter((s) => s.scoreB > s.scoreA).length;
    const pointsA = match.sets.reduce((sum, s) => sum + s.scoreA, 0);
    const pointsB = match.sets.reduce((sum, s) => sum + s.scoreB, 0);

    teamA.matchesPlayed++;
    teamB.matchesPlayed++;
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
  for (const r of rankings) {
    r.setRatio =
      r.setsLost === 0 ? (r.setsWon > 0 ? null : 0) : r.setsWon / r.setsLost;
    r.pointRatio =
      r.pointsConceded === 0
        ? r.pointsScored > 0
          ? null
          : 0
        : r.pointsScored / r.pointsConceded;
  }

  return sortRankings(rankings);
}
