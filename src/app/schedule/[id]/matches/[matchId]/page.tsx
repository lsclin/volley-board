"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarClock, FileText, MapPin } from "lucide-react";
import { matchStatus } from "@/lib/matchStatus";
import { formatSetScore } from "@/lib/setScore";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MatchDetail {
  id: string;
  competitionId: string | null;
  startAt: string | null;
  location: string;
  status: string;
  note: string | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  competition: { id: string; name: string } | null;
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

function setLabel(setNo: number): string {
  return `第${CN_NUM[setNo] ?? setNo}局`;
}

export default function MatchDetailPage() {
  const params = useParams<{ id: string; matchId: string }>();
  const competitionId = params.id;
  const matchId = params.matchId;

  const { data: match, isLoading } = useSWR<MatchDetail>(
    matchId ? `/api/matches/${matchId}` : null,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-10 bg-gray-100 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!match || "error" in match) {
    return (
      <div className="space-y-4">
        <Link
          href={`/schedule/${competitionId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          返回赛事
        </Link>
        <div className="text-center py-16 text-gray-500">比赛不存在或加载失败</div>
      </div>
    );
  }

  const finished = match.status === "finished";

  return (
    <div className="space-y-4">
      <Link
        href={
          match.competitionId
            ? `/schedule/${match.competitionId}#matches`
            : "/schedule"
        }
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        返回赛程
      </Link>

      {/* 对阵与比分 */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        {match.competition ? (
          <Link
            href={`/schedule/${match.competition.id}`}
            className="block text-center text-xs text-gray-400 mb-3 hover:text-blue-600"
          >
            {match.competition.name}
          </Link>
        ) : null}

        <div className="flex items-center justify-center gap-4">
          <span className="text-lg font-bold text-gray-900 flex-1 text-right">
            {match.teamA.name}
          </span>
          <span className="text-3xl font-black text-gray-900 px-2 flex-none">
            {finished ? formatSetScore(match.sets) : "VS"}
          </span>
          <span className="text-lg font-bold text-gray-900 flex-1">
            {match.teamB.name}
          </span>
        </div>

        <div className="flex justify-center mt-3">
          <span className={matchStatus.badge(match.status)}>
            {matchStatus.label(match.status)}
          </span>
        </div>

        {match.note ? (
          <p className="text-center text-sm text-gray-400 mt-3">{match.note}</p>
        ) : null}
      </section>

      {/* 局分 */}
      {match.sets.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 px-1">局分</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {match.sets.map((set) => (
              <div key={set.setNo} className="flex items-center justify-between p-3.5">
                <span className="text-sm text-gray-600">{setLabel(set.setNo)}</span>
                <span className="text-base font-bold text-gray-900">
                  {set.scoreA}
                  <span className="text-gray-300 mx-2">:</span>
                  {set.scoreB}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* 比赛信息 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900 px-1">比赛信息</h2>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          <div className="flex items-center gap-3 p-3.5">
            <CalendarClock className="w-4 h-4 text-gray-400 flex-none" />
            <span className="text-sm text-gray-500 flex-none">比赛时间</span>
            <span className="flex-1 text-right text-sm font-medium text-gray-900">
              {match.startAt
                ? format(parseISO(match.startAt), "M月d日 HH:mm")
                : "时间待确认"}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3.5">
            <MapPin className="w-4 h-4 text-gray-400 flex-none" />
            <span className="text-sm text-gray-500 flex-none">地点</span>
            <span className="flex-1 text-right text-sm font-medium text-gray-900">
              {match.location}
            </span>
          </div>
        </div>
      </section>

      {/*
        比赛记录表：当前绑定在赛事级资料（CompetitionFile）上。
        为后续 Match -> MatchFile / MatchReport 演进预留独立区块：
        届时在此处直接渲染绑定到本场比赛的记录表，并保留赛事资料兜底入口。
      */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900 px-1">比赛记录表</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <FileText className="w-9 h-9 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 text-center">
            比赛记录表归属于赛事资料
          </p>
          {match.competitionId ? (
            <Link
              href={`/schedule/${match.competitionId}#files`}
              className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              前往赛事资料
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
