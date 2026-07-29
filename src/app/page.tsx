"use client";

import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import { format, parseISO } from "date-fns";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { AttendanceButtons } from "@/components/activity/AttendanceButtons";
import {
  TodayScheduleCard,
  WeeklyScheduleList,
} from "@/components/schedule/WeeklyScheduleCards";
import { useActivities } from "@/lib/useActivities";
import { useTodaySchedule } from "@/lib/useTodaySchedule";
import { ActivityWithCounts } from "@/types";
import { matchStatus } from "@/lib/matchStatus";
import { ChevronRight, Info, MapPin, Trophy } from "lucide-react";
import Link from "next/link";

const ATTENDANCE_CHANGE_EVENT = "volley-attendance-change";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RecentMatch {
  id: string;
  competitionId: string | null;
  startAt: string;
  location: string;
  status: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  competition: { id: string; name: string } | null;
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

function readStoredStatuses(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const statuses: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("attendance_")) continue;
    const status = localStorage.getItem(key);
    if (status && status !== "cancelled") {
      statuses[key.replace("attendance_", "")] = status;
    }
  }
  return statuses;
}

function getAttendanceSnapshot(): string {
  return JSON.stringify(readStoredStatuses());
}

function subscribeToAttendanceChanges(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(ATTENDANCE_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(ATTENDANCE_CHANGE_EVENT, handler);
  };
}

function setStoredStatus(activityId: string, status: string) {
  if (typeof window === "undefined") return;
  if (status === "cancelled") {
    localStorage.removeItem(`attendance_${activityId}`);
  } else {
    localStorage.setItem(`attendance_${activityId}`, status);
  }
  window.dispatchEvent(new Event(ATTENDANCE_CHANGE_EVENT));
}

function getSetScore(match: RecentMatch) {
  const setsA = match.sets.filter((set) => set.scoreA > set.scoreB).length;
  const setsB = match.sets.filter((set) => set.scoreB > set.scoreA).length;
  return `${setsA} : ${setsB}`;
}

function RecentMatchesSection() {
  const { data: matches, isLoading } = useSWR<RecentMatch[]>(
    "/api/matches?limit=3",
    fetcher,
  );
  const recentMatches = Array.isArray(matches) ? matches.slice(0, 3) : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">最近比赛</h2>
          <p className="text-xs text-gray-500 mt-0.5">最新赛程与比分</p>
        </div>
        <Link href="/schedule" className="text-sm text-blue-600 hover:underline">
          全部赛事
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : recentMatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <Trophy className="w-9 h-9 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">暂无比赛记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentMatches.map((match) => {
            const detailHref = match.competitionId
              ? `/schedule/${match.competitionId}`
              : null;
            const card = (
              <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    {match.competition ? (
                      <p className="text-xs text-gray-400 truncate">
                        {match.competition.name}
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-500">
                      {format(parseISO(match.startAt), "M月d日 HH:mm")}
                    </p>
                  </div>
                  <span className={matchStatus.badge(match.status)}>
                    {matchStatus.label(match.status)}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="font-bold text-gray-900 truncate">
                    {match.teamA.name}
                  </span>
                  <span className="text-lg font-black text-gray-900 px-2">
                    {match.status === "finished" ? getSetScore(match) : "VS"}
                  </span>
                  <span className="font-bold text-gray-900 truncate">
                    {match.teamB.name}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 flex-none" />
                    <span className="truncate">{match.location}</span>
                  </span>
                  {detailHref ? (
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-none" />
                  ) : null}
                </div>
              </div>
            );

            return detailHref ? (
              <Link key={match.id} href={detailHref} className="block">
                {card}
              </Link>
            ) : (
              <div key={match.id}>{card}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { activities, isLoading, mutate } = useActivities();
  const todaySchedule = useTodaySchedule();
  const statusSnapshot = useSyncExternalStore(
    subscribeToAttendanceChanges,
    getAttendanceSnapshot,
    () => "{}",
  );
  const statuses = JSON.parse(statusSnapshot) as Record<string, string>;

  const handleAttendanceUpdate = useCallback(
    (activityId: string) =>
      (
        newStatus: string,
        counts?: { expectedCount: number; arrivedCount: number },
      ) => {
        setStoredStatus(activityId, newStatus);
        if (!counts) {
          mutate();
          return;
        }
        mutate(
          (current) =>
            current?.map((activity) =>
              activity.id === activityId
                ? {
                    ...activity,
                    expectedCount: counts.expectedCount,
                    arrivedCount: counts.arrivedCount,
                  }
                : activity,
            ),
          { revalidate: false },
        );
      },
    [mutate],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">活动看板</h1>
        <p className="text-sm text-gray-500 mt-0.5">野球 & 训练实时签到</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">野球活动</h2>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse"
              >
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="space-y-3">
            {todaySchedule ? (
              <TodayScheduleCard item={todaySchedule} />
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
                正在读取今日固定安排...
              </div>
            )}
            <Link
              href="/weekly-schedule"
              className="inline-flex items-center text-sm text-blue-600 hover:underline"
            >
              查看完整固定安排 →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: ActivityWithCounts) => (
              <ActivityCard key={activity.id} activity={activity}>
                {activity.status === "scheduled" || activity.status === "live" ? (
                  <AttendanceButtons
                    activityId={activity.id}
                    currentStatus={statuses[activity.id] || null}
                    onUpdate={handleAttendanceUpdate(activity.id)}
                    disabled={activity.status !== "scheduled" && activity.status !== "live"}
                  />
                ) : null}
              </ActivityCard>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">每周固定安排</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              默认场地使用情况，不自动生成活动
            </p>
          </div>
          <Link
            href="/weekly-schedule"
            className="flex-none text-sm text-blue-600 hover:underline"
          >
            详情
          </Link>
        </div>
        <WeeklyScheduleList highlightWeekday={todaySchedule?.weekday} />
      </section>

      <section className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 flex-none text-blue-600" />
          <div>
            <h2 className="text-sm font-semibold text-blue-900">野球提示</h2>
            <p className="mt-1 text-xs leading-5 text-blue-800">
              无固定队伍，到场后线下自行组队即可
            </p>
          </div>
        </div>
      </section>

      <RecentMatchesSection />
    </div>
  );
}
