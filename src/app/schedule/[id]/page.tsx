"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { matchStatus } from "@/lib/matchStatus";
import { TeamRanking } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CompetitionFileItem {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface MatchItem {
  id: string;
  startAt: string;
  location: string;
  status: string;
  note: string | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

interface CompetitionDetail {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  matches: MatchItem[];
  files: CompetitionFileItem[];
}

const statusLabel: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  finished: "已结束",
  archived: "已归档",
};

const statusVariant: Record<string, "info" | "success" | "default"> = {
  upcoming: "info",
  ongoing: "success",
  finished: "default",
  archived: "default",
};

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "时间待定";
  if (startDate && !endDate) return format(parseISO(startDate), "yyyy年M月d日");
  if (!startDate && endDate) return `截至 ${format(parseISO(endDate), "yyyy年M月d日")}`;

  return `${format(parseISO(startDate!), "yyyy年M月d日")} - ${format(parseISO(endDate!), "M月d日")}`;
}

function getSetScore(match: MatchItem) {
  const setsA = match.sets.filter((set) => set.scoreA > set.scoreB).length;
  const setsB = match.sets.filter((set) => set.scoreB > set.scoreA).length;
  return `${setsA} : ${setsB}`;
}

export default function CompetitionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: competition, isLoading } = useSWR<CompetitionDetail>(
    id ? `/api/competitions/${id}` : null,
    fetcher,
  );
  const { data: rankings } = useSWR<TeamRanking[]>(
    id ? `/api/rankings?competitionId=${id}` : null,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="h-40 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  if (!competition || "error" in competition) {
    return (
      <div className="space-y-4">
        <Link
          href="/schedule"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          返回赛程
        </Link>
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">赛事不存在或加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/schedule"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        返回赛程
      </Link>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {competition.name}
            </h1>
            {competition.season ? (
              <p className="text-sm text-gray-500 mt-0.5">{competition.season}</p>
            ) : null}
          </div>
          <Badge variant={statusVariant[competition.status] || "default"}>
            {statusLabel[competition.status] || competition.status}
          </Badge>
        </div>

        {competition.description ? (
          <p className="text-sm text-gray-600 mt-3 leading-6">
            {competition.description}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              时间
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatDateRange(competition.startDate, competition.endDate)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Users className="w-3.5 h-3.5" />
              规模
            </div>
            <p className="text-sm font-medium text-gray-900">
              {competition.matches.length} 场比赛 · {competition.files.length} 个文件
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 px-1">赛事排名</h2>
        {!rankings || rankings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
            暂无排名数据
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {rankings.map((team, index) => {
              const setDiff = team.setsWon - team.setsLost;
              const pointDiff = team.pointsScored - team.pointsConceded;
              return (
                <div
                  key={team.teamId}
                  className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0"
                >
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {team.teamName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {team.wins}胜 {team.losses}负 · {team.points}分
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>局 {setDiff > 0 ? `+${setDiff}` : setDiff}</p>
                    <p>分 {pointDiff > 0 ? `+${pointDiff}` : pointDiff}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500 px-1">比赛安排</h2>
        {competition.matches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
            暂无比赛
          </div>
        ) : (
          <div className="space-y-3">
            {competition.matches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm text-gray-500">
                    {format(parseISO(match.startAt), "M月d日 HH:mm")}
                  </div>
                  <span className={matchStatus.badge(match.status)}>
                    {matchStatus.label(match.status)}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 py-3">
                  <span className="text-lg font-bold text-gray-900 truncate">
                    {match.teamA.name}
                  </span>
                  <span className="text-xl font-black text-gray-900 px-2">
                    {match.status === "finished" ? getSetScore(match) : "VS"}
                  </span>
                  <span className="text-lg font-bold text-gray-900 truncate">
                    {match.teamB.name}
                  </span>
                </div>

                {match.sets.length > 0 ? (
                  <div className="flex justify-center gap-2 flex-wrap mb-3">
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
                  <p className="text-sm text-gray-400 mt-2">{match.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {competition.files.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500 px-1">赛事资料</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {competition.files.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 text-sm text-gray-700 hover:text-blue-600"
              >
                <FileText className="w-4 h-4 flex-none" />
                <span className="truncate">{file.name}</span>
              </a>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
