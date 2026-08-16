import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatActivityTime(startAt: Date, endAt: Date): string {
  const timeRange = `${format(startAt, "HH:mm")} - ${format(endAt, "HH:mm")}`;

  if (isToday(startAt)) {
    return `今天 ${timeRange}`;
  }
  if (isTomorrow(startAt)) {
    return `明天 ${timeRange}`;
  }

  return `${format(startAt, "M月d日")} ${timeRange}`;
}

export function formatDate(date: Date): string {
  return format(date, "yyyy年M月d日");
}

export function formatDateTime(date: Date): string {
  return format(date, "yyyy年M月d日 HH:mm");
}

export function getActivityGroup(startAt: Date): "today" | "tomorrow" | "thisWeek" | "later" {
  if (isToday(startAt)) return "today";
  if (isTomorrow(startAt)) return "tomorrow";
  if (isThisWeek(startAt, { weekStartsOn: 1 })) return "thisWeek";
  return "later";
}

export function isActivityActive(status: string): boolean {
  return status === "scheduled" || status === "live";
}

/** 今天 / 明天 / 周X / M月d日 周X —— 用于近期场地安排与赛程分组标题 */
export function formatDayLabel(date: Date): string {
  if (isToday(date)) return "今天";
  if (isTomorrow(date)) return "明天";
  return format(date, "M月d日 · EEEE", { locale: zhCN });
}

/** 比赛时间展示；startAt 为空（时间待确认）时返回占位文案 */
export function formatMatchTime(startAt: string | null | undefined): string {
  if (!startAt) return "时间待确认";
  return format(parseISO(startAt), "M月d日 HH:mm");
}
