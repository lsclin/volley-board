"use client";

import useSWR from "swr";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { formatDayLabel } from "@/lib/time";
import { Badge } from "@/components/ui/Badge";
import { Calendar, ChevronRight, Info, Trophy } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OngoingComp {
  id: string;
  name: string;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalMatches: number;
  finishedMatches: number;
  fileCount: number;
  nextMatch: {
    id: string;
    startAt: string | null;
    teamAName: string;
    teamBName: string;
    status: string;
  } | null;
}

interface UpcomingMatch {
  id: string;
  startAt: string | null;
  status: string;
  teamA: { name: string };
  teamB: { name: string };
  competition: { id: string; name: string } | null;
}

interface UpcomingActivity {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  location: string;
  status: string;
  note: string | null;
}

interface ResultMatch {
  id: string;
  startAt: string | null;
  status: string;
  teamA: { name: string };
  teamB: { name: string };
  competition: { id: string; name: string } | null;
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

interface HomeData {
  ongoing: OngoingComp[];
  upcomingMatches: UpcomingMatch[];
  upcomingActivities: UpcomingActivity[];
  latestResults: ResultMatch[];
}

const activityTypeLabel: Record<string, string> = {
  pickup: "野球",
  training: "训练",
  friendly: "友谊赛",
  match: "比赛",
};

function getSetScore(match: { sets: { scoreA: number; scoreB: number }[] }) {
  const setsA = match.sets.filter((set) => set.scoreA > set.scoreB).length;
  const setsB = match.sets.filter((set) => set.scoreB > set.scoreA).length;
  return `${setsA} : ${setsB}`;
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

export default function Home() {
  const { data, isLoading } = useSWR<HomeData>("/api/home", fetcher);

  // 近期场地安排：真实确定的比赛 + 管理员发布的活动，按时间合并
  const items: {
    key: string;
    kind: "match" | "activity";
    startAt: Date;
    match?: UpcomingMatch;
    activity?: UpcomingActivity;
  }[] = [];
  if (data) {
    for (const match of data.upcomingMatches) {
      if (!match.startAt) continue;
      items.push({
        key: `match-${match.id}`,
        kind: "match",
        startAt: parseISO(match.startAt),
        match,
      });
    }
    for (const activity of data.upcomingActivities) {
      items.push({
        key: `activity-${activity.id}`,
        kind: "activity",
        startAt: parseISO(activity.startAt),
        activity,
      });
    }
  }
  items.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  const dayGroups: { dayKey: string; dayLabel: string; items: typeof items }[] =
    [];
  for (const item of items.slice(0, 10)) {
    const dayKey = format(item.startAt, "yyyy-MM-dd");
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.dayKey === dayKey) {
      last.items.push(item);
    } else {
      dayGroups.push({
        dayKey,
        dayLabel: formatDayLabel(item.startAt),
        items: [item],
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">排协看板</h1>
        <p className="text-sm text-gray-500 mt-0.5">赛事进度、近期比赛与活动信息</p>
      </div>

      {/* 正在进行 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">正在进行</h2>
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-full mb-4" />
            <div className="h-2 bg-gray-100 rounded-full" />
          </div>
        ) : !data || data.ongoing.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Trophy className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂无进行中的赛事</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.ongoing.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {comp.name}
                      </h3>
                      <Badge variant="success">进行中</Badge>
                    </div>
                    {comp.season ? (
                      <p className="text-sm text-gray-500 mt-0.5">{comp.season}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">
                      已完成 {comp.finishedMatches} / {comp.totalMatches} 场
                    </span>
                    <span className="text-xs text-gray-400">
                      {comp.totalMatches > 0
                        ? `${Math.round((comp.finishedMatches / comp.totalMatches) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                  <ProgressBar
                    value={comp.finishedMatches}
                    total={comp.totalMatches}
                  />
                </div>

                <div className="mt-3 text-sm">
                  {comp.nextMatch ? (
                    <p className="text-gray-700">
                      <span className="text-gray-500">下一场：</span>
                      {comp.nextMatch.startAt
                        ? format(parseISO(comp.nextMatch.startAt), "M月d日 HH:mm")
                        : "时间待确认"}
                      <span className="text-gray-400"> · </span>
                      {comp.nextMatch.teamAName} VS {comp.nextMatch.teamBName}
                    </p>
                  ) : (
                    <p className="text-gray-500">下一场：暂无安排</p>
                  )}
                </div>

                <Link
                  href={`/schedule/${comp.id}`}
                  className="inline-flex items-center gap-0.5 mt-3 text-sm font-medium text-blue-600 hover:underline"
                >
                  查看赛事详情
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 近期场地安排 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">近期场地安排</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              已确定时间的比赛与活动
            </p>
          </div>
          <Link
            href="/schedule"
            className="flex-none text-sm text-blue-600 hover:underline"
          >
            全部赛事
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-6 bg-gray-100 rounded w-full mb-2" />
            <div className="h-6 bg-gray-100 rounded w-2/3" />
          </div>
        ) : dayGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Calendar className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂无近期安排</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayGroups.map((group) => (
              <div key={group.dayKey}>
                <p className="text-xs font-semibold text-gray-400 px-1 mb-2">
                  {group.dayLabel}
                </p>
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {group.items.map((item) => {
                    if (item.kind === "activity") {
                      const activity = item.activity!;
                      return (
                        <div key={item.key} className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-blue-600 w-14 flex-none">
                              {format(item.startAt, "HH:mm")}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {activity.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {activityTypeLabel[activity.type] || "活动"} ·{" "}
                                {activity.location}
                              </p>
                            </div>
                            <span className="flex-none inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {activity.status === "live" ? "进行中" : "活动"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    const match = item.match!;
                    const href = match.competition
                      ? `/schedule/${match.competition.id}/matches/${match.id}`
                      : null;
                    const inner = (
                      <div className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600 w-14 flex-none">
                            {format(item.startAt, "HH:mm")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 truncate">
                              {match.competition?.name}
                            </p>
                            <p className="font-medium text-gray-900 truncate">
                              {match.teamA.name}
                              <span className="text-gray-400 mx-1.5">VS</span>
                              {match.teamB.name}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                        </div>
                      </div>
                    );
                    return href ? (
                      <Link key={item.key} href={href} className="block hover:bg-gray-50">
                        {inner}
                      </Link>
                    ) : (
                      <div key={item.key}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 最新赛果 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">最新赛果</h2>
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-6 bg-gray-100 rounded w-full mb-2" />
            <div className="h-6 bg-gray-100 rounded w-2/3" />
          </div>
        ) : !data || data.latestResults.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <Trophy className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂无赛果</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {data.latestResults.map((match) => {
              const href = match.competition
                ? `/schedule/${match.competition.id}/matches/${match.id}`
                : null;
              const inner = (
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs text-gray-400 truncate">
                      {match.competition?.name}
                    </p>
                    {match.startAt ? (
                      <p className="text-xs text-gray-400 flex-none">
                        {format(parseISO(match.startAt), "M月d日")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-bold text-gray-900 flex-1 text-right truncate">
                      {match.teamA.name}
                    </span>
                    <span className="text-lg font-black text-gray-900 px-2 flex-none">
                      {getSetScore(match)}
                    </span>
                    <span className="font-bold text-gray-900 flex-1 truncate">
                      {match.teamB.name}
                    </span>
                  </div>
                </div>
              );
              return href ? (
                <Link key={match.id} href={href} className="block hover:bg-gray-50">
                  {inner}
                </Link>
              ) : (
                <div key={match.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </section>

      {/* 说明 */}
      <section className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-none text-blue-600" />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">说明</h2>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              QQ群负责即时通知、野球接龙和临时沟通；本网站负责赛事进度、比赛安排、比分排名和资料沉淀。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
