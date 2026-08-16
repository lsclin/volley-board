import type {
  Activity as PrismaActivity,
  Attendance as PrismaAttendance,
  Match as PrismaMatch,
  Team as PrismaTeam,
  MatchSet as PrismaMatchSet,
  Competition as PrismaCompetition,
  CompetitionFile as PrismaCompetitionFile,
} from "@prisma/client";
import {
  ActivityStatus,
  ActivityType,
  AttendanceStatus,
  MatchStatus,
  CompetitionStatus,
} from "@prisma/client";

export type Activity = PrismaActivity;
export type Attendance = PrismaAttendance;
export type Match = PrismaMatch;
export type Team = PrismaTeam;
export type MatchSet = PrismaMatchSet;
export type Competition = PrismaCompetition;
export type CompetitionFile = PrismaCompetitionFile;
export { ActivityStatus, ActivityType, AttendanceStatus, MatchStatus, CompetitionStatus };

export interface ActivityWithCounts {
  id: string;
  title: string;
  type: string;
  startAt: Date;
  endAt: Date;
  location: string;
  note: string | null;
  status: string;
  visible: boolean;
  manualExpectedDelta: number;
  manualArrivedDelta: number;
  peakArrivedCount: number;
  createdAt: Date;
  updatedAt: Date;
  expectedCount: number;
  arrivedCount: number;
}

export interface HistoryActivity {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location: string;
  note: string | null;
  expectedCount: number;
  arrivedCount: number;
  peakArrivedCount: number;
}

export interface HistoryStats {
  totalActivities: number;
  avgArrived: number;
  topLocation: string;
  topLocationCount: number;
  topHour: number;
  topHourCount: number;
  activities: HistoryActivity[];
}

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
  /** 胜负局比 = 胜局 / 负局；负局为 0 且胜局 > 0 时为 null（表示无穷大），全部为 0 时为 0 */
  setRatio: number | null;
  /** 得失分比 = 总得分 / 总失分；总失分为 0 且总得分 > 0 时为 null（表示无穷大），全部为 0 时为 0 */
  pointRatio: number | null;
}

export interface CompetitionWithMatches extends Competition {
  matches: (Match & { teamA: Team; teamB: Team; sets: MatchSet[] })[];
  files: CompetitionFile[];
}