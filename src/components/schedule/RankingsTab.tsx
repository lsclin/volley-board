"use client";

import { useState } from "react";
import type { TeamRanking } from "@/types";
import { cn } from "@/lib/cn";
import { Info } from "lucide-react";

interface RankingsTabProps {
  rankings: TeamRanking[] | undefined;
  isLoading?: boolean;
}

function ratioText(value: number | null): string {
  if (value === null) return "∞";
  return value.toFixed(2);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function RankingsTab({ rankings, isLoading }: RankingsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-none text-blue-600" />
          <p className="text-xs leading-5 text-blue-800">
            排名规则：胜场 → 积分 → 胜负局比 → 得失分比
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/2 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      ) : !rankings || rankings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          暂无排名数据
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {rankings.map((team, index) => {
            const expanded = expandedId === team.teamId;
            return (
              <div
                key={team.teamId}
                className={cn(
                  "border-b border-gray-100 last:border-b-0",
                  expanded && "bg-gray-50/60",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : team.teamId)
                  }
                  className="w-full flex items-center gap-3 p-3.5 text-left"
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-none",
                      index === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : index === 1
                          ? "bg-gray-200 text-gray-700"
                          : index === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {team.teamName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {team.matchesPlayed}场 · {team.wins}胜 {team.losses}负 ·{" "}
                      {team.points}分
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-gray-300 transition-transform flex-none",
                      expanded && "rotate-180",
                    )}
                  >
                    ▾
                  </span>
                </button>

                {expanded ? (
                  <div className="px-4 pb-4 grid grid-cols-2 gap-x-6 gap-y-2">
                    <DetailRow label="比赛" value={`${team.matchesPlayed} 场`} />
                    <DetailRow label="胜 / 负" value={`${team.wins} / ${team.losses}`} />
                    <DetailRow label="积分" value={`${team.points}`} />
                    <DetailRow
                      label="局"
                      value={`${team.setsWon} : ${team.setsLost}`}
                    />
                    <DetailRow label="胜负局比" value={ratioText(team.setRatio)} />
                    <DetailRow
                      label="得分"
                      value={`${team.pointsScored} : ${team.pointsConceded}`}
                    />
                    <DetailRow
                      label="得失分比"
                      value={ratioText(team.pointRatio)}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 px-1">按已完成比赛统计</p>
    </div>
  );
}
