"use client";

import { parseISO } from "date-fns";
import { MatchCard } from "./MatchCard";
import type { CompetitionDetail } from "./competitionTypes";
import { CalendarClock, Users } from "lucide-react";

interface OverviewTabProps {
  competition: CompetitionDetail;
}

function ProgressBar({ value, total }: { value: number; total: number }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function OverviewTab({ competition }: OverviewTabProps) {
  const now = new Date();
  const matches = competition.matches;

  const finished = matches
    .filter((m) => m.status === "finished")
    .sort((a, b) =>
      (b.startAt ? parseISO(b.startAt).getTime() : 0) -
      (a.startAt ? parseISO(a.startAt).getTime() : 0),
    );
  const pendingCount = matches.filter((m) => m.status === "pending").length;

  const next =
    matches
      .filter(
        (m) => m.status === "scheduled" && m.startAt && parseISO(m.startAt) > now,
      )
      .sort(
        (a, b) => parseISO(a.startAt!).getTime() - parseISO(b.startAt!).getTime(),
      )[0] ?? matches.find((m) => m.status === "pending") ?? null;

  const recentResults = finished.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* 赛事进度 */}
      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">赛事进度</h2>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600">
            {finished.length} / {matches.length} 场已完成
          </span>
          <span className="text-xs text-gray-400">
            {matches.length > 0
              ? `${Math.round((finished.length / matches.length) * 100)}%`
              : "0%"}
          </span>
        </div>
        <ProgressBar value={finished.length} total={matches.length} />
        {pendingCount > 0 ? (
          <p className="text-xs text-gray-500 mt-2">
            另有 {pendingCount} 场比赛时间待确认
          </p>
        ) : null}
      </section>

      {/* 下一场比赛 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900 px-1">下一场比赛</h2>
        {next ? (
          <MatchCard match={next} competitionId={competition.id} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <CalendarClock className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂无待进行的比赛</p>
          </div>
        )}
      </section>

      {/* 最近赛果 */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-gray-900">最近赛果</h2>
          <span className="text-xs text-gray-400">
            {finished.length} 场已完赛
          </span>
        </div>
        {recentResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
            暂无赛果
          </div>
        ) : (
          <div className="space-y-2">
            {recentResults.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                competitionId={competition.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* 参赛队伍 */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-900">参赛队伍</h2>
          <span className="text-xs text-gray-400">
            {competition.teams.length} 支
          </span>
        </div>
        {competition.teams.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
            暂无队伍信息
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {competition.teams.map((team) => (
                <span
                  key={team.id}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700"
                >
                  {team.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
