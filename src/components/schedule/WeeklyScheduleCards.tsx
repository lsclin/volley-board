import { CalendarDays, Clock, MapPin } from "lucide-react";
import {
  type WeeklyScheduleItem,
  weeklySchedule,
} from "@/config/weeklySchedule";

function getTypeLabel(type: WeeklyScheduleItem["type"]) {
  if (type === "pickup") return "野球";
  if (type === "team_training") return "训练";
  return "空闲";
}

function getTypeClass(type: WeeklyScheduleItem["type"]) {
  if (type === "pickup") return "bg-blue-50 text-blue-700";
  if (type === "team_training") return "bg-emerald-50 text-emerald-700";
  return "bg-gray-100 text-gray-500";
}

export function TodayScheduleCard({
  item,
  compact = false,
}: {
  item: WeeklyScheduleItem;
  compact?: boolean;
}) {
  const hasSchedule = item.type !== "none";
  const todayTimeLabel = item.timeLabel === "晚上" ? "今晚" : item.timeLabel;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">今日固定安排</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {hasSchedule
              ? `${todayTimeLabel ? `${todayTimeLabel}：` : ""}${item.title}`
              : "今天暂无固定安排"}
          </h2>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeClass(
            item.type,
          )}`}
        >
          {getTypeLabel(item.type)}
        </span>
      </div>

      {hasSchedule ? (
        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>时间：{todayTimeLabel}</span>
          </p>
          {item.location ? (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>地点：{item.location}</span>
            </p>
          ) : null}
          {item.note ? (
            <p className="leading-6 text-gray-500">说明：{item.note}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          今天没有固定场地安排，如需活动请等待管理员创建。
        </p>
      )}

      {!compact ? (
        <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-5 text-gray-500">
          固定安排只用于展示默认场地使用情况，不会自动生成活动，也不会进入历史统计。
        </p>
      ) : null}
    </div>
  );
}

export function WeeklyScheduleList({
  highlightWeekday,
}: {
  highlightWeekday?: number;
}) {
  return (
    <div className="space-y-2">
      {weeklySchedule.map((item) => {
        const isToday = item.weekday === highlightWeekday;
        return (
          <div
            key={item.weekday}
            className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
              isToday
                ? "border-blue-200 bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${
                  isToday ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {item.label}
                  {item.timeLabel ? ` ${item.timeLabel}` : ""}
                </p>
                <p className="text-sm text-gray-500">
                  {item.type === "none" ? "暂无固定安排" : item.title}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
              </div>
            </div>
            {isToday ? (
              <span className="flex-none rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                今天
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
