"use client";

import useSWR from "swr";
import { matchStatus } from "@/lib/matchStatus";
import { formatDateTime } from "@/lib/time";
import { Calendar, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MatchWithDetails {
  id: string;
  startAt: string;
  location: string;
  status: string;
  note: string | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

export default function SchedulePage() {
  const { data: matches, isLoading } = useSWR<MatchWithDetails[]>(
    "/api/matches",
    fetcher,
  );

  const grouped = groupMatchesByDate(matches || []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">比赛赛程</h1>
        <p className="text-sm text-gray-500 mt-0.5">比赛安排与结果</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !matches || matches.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-base">暂无比赛</p>
          <Link
            href="/rankings"
            className="inline-block mt-4 text-sm text-blue-600 hover:underline"
          >
            查看排名 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateLabel, dayMatches]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-medium text-gray-500 px-1 mb-2">
                {dateLabel}
              </h2>
              <div className="space-y-2">
                {dayMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {formatDateTime(new Date(match.startAt))}
                        </span>
                      </div>
                      <span className={matchStatus.badge(match.status)}>
                        {matchStatus.label(match.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-3">
                      <span className="text-lg font-bold text-gray-900">
                        {match.teamA.name}
                      </span>
                      {match.status === "finished" ? (
                        <span className="text-xl font-black text-gray-900 px-3">
                          {match.sets.filter((s) => s.scoreA > s.scoreB).length}
                          {" : "}
                          {match.sets.filter((s) => s.scoreB > s.scoreA).length}
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-gray-400 px-3">
                          VS
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900">
                        {match.teamB.name}
                      </span>
                    </div>

                    {match.sets.length > 0 ? (
                      <div className="flex justify-center gap-2 mt-1 mb-2">
                        {match.sets.map((set) => (
                          <span
                            key={set.setNo}
                            className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded"
                          >
                            第{set.setNo}局 {set.scoreA}:{set.scoreB}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{match.location}</span>
                    </div>

                    {match.note ? (
                      <p className="mt-2 text-sm text-gray-400">
                        {match.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupMatchesByDate(matches: MatchWithDetails[]): Record<string, MatchWithDetails[]> {
  const grouped: Record<string, MatchWithDetails[]> = {};
  const now = new Date();

  for (const match of matches) {
    const date = new Date(match.startAt);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const matchDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor(
      (matchDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    let label: string;
    if (diffDays === 0) label = "今天";
    else if (diffDays === 1) label = "明天";
    else if (diffDays > 1 && diffDays <= 7) label = "本周";
    else if (diffDays < 0 && diffDays >= -7) label = "最近";
    else label = `${date.getFullYear()}年${date.getMonth() + 1}月`;

    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(match);
  }

  return grouped;
}