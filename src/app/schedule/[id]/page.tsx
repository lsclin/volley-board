"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OverviewTab } from "@/components/schedule/OverviewTab";
import { MatchesTab } from "@/components/schedule/MatchesTab";
import { RankingsTab } from "@/components/schedule/RankingsTab";
import { FilesTab } from "@/components/schedule/FilesTab";
import type { CompetitionDetail } from "@/components/schedule/competitionTypes";
import type { TeamRanking } from "@/types";
import { cn } from "@/lib/cn";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TABS = [
  { key: "overview", label: "概览" },
  { key: "matches", label: "赛程" },
  { key: "rankings", label: "排名" },
  { key: "files", label: "资料" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
  if (!startDate && endDate)
    return `截至 ${format(parseISO(endDate), "yyyy年M月d日")}`;
  return `${format(parseISO(startDate!), "yyyy年M月d日")} - ${format(parseISO(endDate!), "M月d日")}`;
}

export default function CompetitionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState<TabKey>("overview");

  // 支持 #overview / #matches / #rankings / #files 定位（比赛详情页返回时恢复赛程 Tab）
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.key === hash)) {
        setTab(hash as TabKey);
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const { data: competition, isLoading } = useSWR<CompetitionDetail>(
    id ? `/api/competitions/${id}` : null,
    fetcher,
  );
  const { data: rankings, isLoading: rankingsLoading } = useSWR<TeamRanking[]>(
    id && tab === "rankings" ? `/api/rankings?competitionId=${id}` : null,
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
          返回赛事
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
        返回赛事
      </Link>

      {/* 头部 */}
      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {competition.name}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {competition.season ? `${competition.season} · ` : ""}
              {formatDateRange(competition.startDate, competition.endDate)}
            </p>
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
      </section>

      {/* Tab 切换 */}
      <div className="sticky top-[53px] z-20 -mx-1 px-1 py-1 bg-gray-50">
        <div className="grid grid-cols-4 rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "py-1.5 rounded-lg text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 内容 */}
      {tab === "overview" ? <OverviewTab competition={competition} /> : null}
      {tab === "matches" ? (
        <MatchesTab matches={competition.matches} competitionId={competition.id} />
      ) : null}
      {tab === "rankings" ? (
        <RankingsTab rankings={rankings} isLoading={rankingsLoading} />
      ) : null}
      {tab === "files" ? <FilesTab files={competition.files} /> : null}
    </div>
  );
}
