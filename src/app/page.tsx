"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { AttendanceButtons } from "@/components/activity/AttendanceButtons";
import { useActivities } from "@/lib/useActivities";
import { ActivityWithCounts } from "@/types";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

const ATTENDANCE_CHANGE_EVENT = "volley-attendance-change";

function readStoredStatuses(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const statuses: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("attendance_")) continue;
    const status = localStorage.getItem(key);
    if (status) statuses[key.replace("attendance_", "")] = status;
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

function getStoredStatus(activityId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`attendance_${activityId}`);
}

function setStoredStatus(activityId: string, status: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`attendance_${activityId}`, status);
  window.dispatchEvent(new Event(ATTENDANCE_CHANGE_EVENT));
}

export default function Home() {
  const { activities, isLoading, mutate } = useActivities();
  const statusSnapshot = useSyncExternalStore(
    subscribeToAttendanceChanges,
    getAttendanceSnapshot,
    () => "{}",
  );
  const statuses = JSON.parse(statusSnapshot) as Record<string, string>;

  const handleAttendanceUpdate = useCallback(
    (activityId: string) => (newStatus: string) => {
      setStoredStatus(activityId, newStatus);
      mutate();
    },
    [mutate],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">活动看板</h1>
        <p className="text-sm text-gray-500 mt-0.5">野球 & 训练实时签到</p>
      </div>

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
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-base mb-2">暂无活动</p>
          <p className="text-gray-400 text-sm">
            管理员创建野球场次后会在这里显示
          </p>
          <Link
            href="/history"
            className="inline-block mt-4 text-sm text-blue-600 hover:underline"
          >
            查看历史记录 →
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
    </div>
  );
}
