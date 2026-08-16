"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { matchStatus } from "@/lib/matchStatus";
import { formatSetScore } from "@/lib/setScore";
import { ChevronRight, MapPin } from "lucide-react";
import type { MatchItem } from "./competitionTypes";

interface MatchCardProps {
  match: MatchItem;
  competitionId?: string;
  /** 是否显示完整日期（M月d日 HH:mm），否则只显示时间 */
  showDate?: boolean;
}

export function MatchCard({
  match,
  competitionId,
  showDate = true,
}: MatchCardProps) {
  const href = competitionId
    ? `/schedule/${competitionId}/matches/${match.id}`
    : null;

  const timeText = match.startAt
    ? showDate
      ? format(parseISO(match.startAt), "M月d日 HH:mm")
      : format(parseISO(match.startAt), "HH:mm")
    : "时间待确认";

  const inner = (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="text-sm text-gray-500">{timeText}</div>
        <span className={matchStatus.badge(match.status)}>
          {matchStatus.label(match.status)}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4 py-2">
        <span className="text-base font-bold text-gray-900 flex-1 text-right truncate">
          {match.teamA.name}
        </span>
        <span className="text-xl font-black text-gray-900 px-2 flex-none">
          {match.status === "finished" ? formatSetScore(match.sets) : "VS"}
        </span>
        <span className="text-base font-bold text-gray-900 flex-1 truncate">
          {match.teamB.name}
        </span>
      </div>

      {match.sets.length > 0 ? (
        <div className="flex justify-center gap-2 flex-wrap mt-2">
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

      <div className="flex items-center justify-between gap-2 mt-3 text-sm text-gray-500">
        <span className="flex items-center gap-1 min-w-0">
          <MapPin className="w-3.5 h-3.5 flex-none" />
          <span className="truncate">{match.location}</span>
        </span>
        {href ? <ChevronRight className="w-4 h-4 text-gray-300 flex-none" /> : null}
      </div>

      {match.note ? (
        <p className="text-sm text-gray-400 mt-2">{match.note}</p>
      ) : null}
    </div>
  );

  const cardClass =
    "bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors";

  return href ? (
    <Link href={href} className={`block ${cardClass}`}>
      {inner}
    </Link>
  ) : (
    <div className={cardClass}>{inner}</div>
  );
}
