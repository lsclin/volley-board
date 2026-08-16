"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { formatDayLabel } from "@/lib/time";
import { MatchCard } from "./MatchCard";
import type { MatchItem } from "./competitionTypes";
import { cn } from "@/lib/cn";

const FILTERS = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "upcoming", label: "即将比赛" },
  { key: "finished", label: "已结束" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

interface MatchesTabProps {
  matches: MatchItem[];
  competitionId: string;
}

export function MatchesTab({ matches, competitionId }: MatchesTabProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const now = new Date();

  const filtered = matches.filter((m) => {
    switch (filter) {
      case "pending":
        return m.status === "pending";
      case "upcoming":
        return (
          m.status === "scheduled" &&
          !!m.startAt &&
          parseISO(m.startAt) > now
        );
      case "finished":
        return m.status === "finished";
      default:
        return true;
    }
  });

  const pendingItems = filtered.filter((m) => m.status === "pending");
  const dated = filtered
    .filter((m) => m.startAt)
    .sort(
      (a, b) => parseISO(a.startAt!).getTime() - parseISO(b.startAt!).getTime(),
    );

  const groups: { key: string; label: string; items: MatchItem[] }[] = [];
  if (pendingItems.length > 0) {
    groups.push({ key: "pending", label: "时间待确认", items: pendingItems });
  }
  for (const match of dated) {
    const dayKey = format(parseISO(match.startAt!), "yyyy-MM-dd");
    const last = groups[groups.length - 1];
    if (last && last.key === dayKey) {
      last.items.push(match);
    } else {
      groups.push({
        key: dayKey,
        label: formatDayLabel(parseISO(match.startAt!)),
        items: [match],
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* 状态筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          该分组下暂无比赛
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="text-xs font-semibold text-gray-400 px-1 mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    competitionId={competitionId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
