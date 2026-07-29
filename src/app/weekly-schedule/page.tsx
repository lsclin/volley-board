"use client";

import Link from "next/link";
import {
  TodayScheduleCard,
  WeeklyScheduleList,
} from "@/components/schedule/WeeklyScheduleCards";
import { useTodaySchedule } from "@/lib/useTodaySchedule";
import { ChevronLeft } from "lucide-react";

export default function WeeklySchedulePage() {
  const today = useTodaySchedule();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4" />
          返回看板
        </Link>
        <h1 className="text-xl font-bold text-gray-900">固定安排</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          排协每周默认场地使用安排
        </p>
      </div>

      {today ? (
        <TodayScheduleCard item={today} />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
          正在读取今日固定安排...
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">每周时间表</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            固定安排仅用于公示默认场地使用情况，不会自动生成活动。
          </p>
        </div>
        <WeeklyScheduleList highlightWeekday={today?.weekday} />
      </section>
    </div>
  );
}
