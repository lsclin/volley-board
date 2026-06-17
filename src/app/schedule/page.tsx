"use client";

import useSWR from "swr";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Calendar, ChevronRight, FileText } from "lucide-react";
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
  matches: unknown[];
  files: unknown[];
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

export default function SchedulePage() {
  const { data: competitions, isLoading } = useSWR<CompetitionItem[]>(
    "/api/competitions",
    fetcher,
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">赛事</h1>
        <p className="text-sm text-gray-500 mt-0.5">所有举办过和正在进行的赛事</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
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
        <div className="space-y-3">
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              href={`/schedule/${comp.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {comp.name}
                    </h3>
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

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                {comp.startDate ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(comp.startDate), "M月d日")}
                    {comp.endDate ? ` - ${format(parseISO(comp.endDate), "M月d日")}` : ""}
                  </span>
                ) : null}
                <span>{comp.matches.length} 场比赛</span>
                {comp.files.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {comp.files.length} 份资料
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
