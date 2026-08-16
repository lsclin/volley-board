export interface CompetitionFileItem {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface TeamItem {
  id: string;
  name: string;
  note: string | null;
}

export interface MatchItem {
  id: string;
  competitionId: string | null;
  startAt: string | null;
  location: string;
  status: string;
  note: string | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

export interface CompetitionDetail {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  matches: MatchItem[];
  files: CompetitionFileItem[];
  teams: TeamItem[];
}
