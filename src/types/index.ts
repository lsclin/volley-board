import type {
  Activity as PrismaActivity,
  Attendance as PrismaAttendance,
  Match as PrismaMatch,
  Team as PrismaTeam,
  MatchSet as PrismaMatchSet,
} from "@prisma/client";
import {
  ActivityStatus,
  ActivityType,
  AttendanceStatus,
  MatchStatus,
} from "@prisma/client";

export type Activity = PrismaActivity;
export type Attendance = PrismaAttendance;
export type Match = PrismaMatch;
export type Team = PrismaTeam;
export type MatchSet = PrismaMatchSet;
export { ActivityStatus, ActivityType, AttendanceStatus, MatchStatus };

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
  wins: number;
  losses: number;
  points: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
}