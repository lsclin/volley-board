"use client";

import useSWR from "swr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Calendar, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CompetitionItem {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  teamCount: number;
  fileCount: number;
  totalMatches: number;
  finishedMatches: number;
  nextMatch: {
    id: string;
    startAt: string | null;
    teamAName: string;
    teamBName: string;
    status: string;
  } | null;
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
  if (startDate && !endDate) return format(parseISO(startDate), "M月d日");
  if (!startDate && endDate) return `截至 ${format(parseISO(endDate), "M月d日")}`;
  return `${format(parseISO(startDate!), "M月d日")} - ${format(parseISO(endDate!), "M月d日")}`;
}

function CompetitionCard({ comp }: { comp: CompetitionItem }) {
  const isOngoing = comp.status === "ongoing";
  return (
    <Link
      href={`/schedule/${comp.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{comp.name}</h3>
            <Badge variant={statusVariant[comp.status] || "default"}>
              {statusLabel[comp.status] || comp.status}
            </Badge>
          </div>
          {comp.season ? (
            <p className="text-sm text-gray-500 mt-0.5">{comp.season}</p>
          ) : null}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
      </div>

      {isOngoing ? (
        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p>
            {comp.finishedMatches} / {comp.totalMatches} 场已完成
          </p>
          {comp.nextMatch ? (
            <p>
              下一场{" "}
              {comp.nextMatch.startAt
                ? format(parseISO(comp.nextMatch.startAt), "M月d日 HH:mm")
                : "时间待确认"}
              <span className="text-gray-400"> · </span>
              {comp.nextMatch.teamAName} VS {comp.nextMatch.teamBName}
            </p>
          ) : (
            <p>下一场：暂无安排</p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateRange(comp.startDate, comp.endDate)}
          </span>
          {comp.teamCount > 0 ? <span>{comp.teamCount} 支队伍</span> : null}
          {comp.totalMatches > 0 ? <span>{comp.totalMatches} 场比赛</span> : null}
        </div>
      )}
    </Link>
  );
}

export default function SchedulePage() {
  const { data: competitions, isLoading } = useSWR<CompetitionItem[]>(
    "/api/competitions",
    fetcher,
  );

  const ongoing = (competitions || []).filter((c) => c.status === "ongoing");
  const upcoming = (competitions || []).filter((c) => c.status === "upcoming");
  const past = (competitions || []).filter(
    (c) => c.status === "finished" || c.status === "archived",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">赛事</h1>
        <p className="text-sm text-gray-500 mt-0.5">所有举办过和正在进行的赛事</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !competitions || competitions.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无赛事</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ongoing.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 px-1">进行中</h2>
              {ongoing.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} />
              ))}
            </section>
          ) : null}

          {upcoming.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 px-1">即将开始</h2>
              {upcoming.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} />
              ))}
            </section>
          ) : null}

          {past.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 px-1">历届赛事</h2>
              {past.map((comp) => (
                <CompetitionCard key={comp.id} comp={comp} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
