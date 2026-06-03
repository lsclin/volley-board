"use client";

import useSWR from "swr";
import { Trophy } from "lucide-react";
import { TeamRanking } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RankingsPage() {
  const { data: rankings, isLoading } = useSWR<TeamRanking[]>(
    "/api/rankings",
    fetcher,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">队伍排名</h1>
        <p className="text-sm text-gray-500 mt-0.5">根据比赛结果自动计算</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : !rankings || rankings.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无排名数据</p>
          <p className="text-gray-400 text-sm mt-1">
            完成比赛并录入比分后自动生成
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-12">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">队伍</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">胜</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">负</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">积分</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">净胜局</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">净胜分</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((team, index) => {
                  const setDiff = team.setsWon - team.setsLost;
                  const pointDiff = team.pointsScored - team.pointsConceded;
                  return (
                    <tr
                      key={team.teamId}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {team.teamName}
                      </td>
                      <td className="text-center px-3 py-3 text-green-700 font-medium">
                        {team.wins}
                      </td>
                      <td className="text-center px-3 py-3 text-red-500">
                        {team.losses}
                      </td>
                      <td className="text-center px-3 py-3 font-bold text-gray-900">
                        {team.points}
                      </td>
                      <td className="text-center px-3 py-3 text-gray-600">
                        {setDiff > 0 ? `+${setDiff}` : setDiff}
                      </td>
                      <td className="text-center px-3 py-3 text-gray-500">
                        {pointDiff > 0 ? `+${pointDiff}` : pointDiff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100">
            {rankings.map((team, index) => {
              const setDiff = team.setsWon - team.setsLost;
              const pointDiff = team.pointsScored - team.pointsConceded;
              return (
                <div key={team.teamId} className="p-4 flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {team.teamName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {team.wins}胜 {team.losses}负 · {team.points}分
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>
                      局 {setDiff > 0 ? `+${setDiff}` : setDiff}
                    </p>
                    <p>
                      分 {pointDiff > 0 ? `+${pointDiff}` : pointDiff}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}