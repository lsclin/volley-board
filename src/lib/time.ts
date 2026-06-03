import { format, isToday, isTomorrow, isThisWeek } from "date-fns";

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
