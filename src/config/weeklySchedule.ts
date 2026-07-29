export type WeeklyScheduleType = "pickup" | "team_training" | "none";

export type WeeklyScheduleItem = {
  weekday: number;
  label: string;
  type: WeeklyScheduleType;
  title: string;
  timeLabel: string;
  location?: string;
  note?: string;
};

export const WEEKLY_SCHEDULE_LOCATION = "室内排球场";

export const weeklySchedule: WeeklyScheduleItem[] = [
  {
    weekday: 1,
    label: "周一",
    type: "team_training",
    title: "校队训练",
    timeLabel: "晚上",
    location: WEEKLY_SCHEDULE_LOCATION,
    note: "训练时间段场地默认被占用。",
  },
  {
    weekday: 2,
    label: "周二",
    type: "pickup",
    title: "野球",
    timeLabel: "晚上",
    location: WEEKLY_SCHEDULE_LOCATION,
    note: "无特殊情况按固定安排进行。如需统计人数，请等待管理员创建今日野球活动。",
  },
  {
    weekday: 3,
    label: "周三",
    type: "none",
    title: "暂无固定安排",
    timeLabel: "",
  },
  {
    weekday: 4,
    label: "周四",
    type: "pickup",
    title: "野球",
    timeLabel: "晚上",
    location: WEEKLY_SCHEDULE_LOCATION,
    note: "无特殊情况按固定安排进行。如需统计人数，请等待管理员创建今日野球活动。",
  },
  {
    weekday: 5,
    label: "周五",
    type: "team_training",
    title: "校队训练",
    timeLabel: "晚上",
    location: WEEKLY_SCHEDULE_LOCATION,
    note: "训练时间段场地默认被占用。",
  },
  {
    weekday: 6,
    label: "周六",
    type: "pickup",
    title: "野球",
    timeLabel: "晚上",
    location: WEEKLY_SCHEDULE_LOCATION,
    note: "无特殊情况按固定安排进行。如需统计人数，请等待管理员创建今日野球活动。",
  },
  {
    weekday: 0,
    label: "周日",
    type: "team_training",
    title: "校队训练",
    timeLabel: "晚上",
    location: WEEKLY_SCHEDULE_LOCATION,
    note: "训练时间段场地默认被占用。",
  },
];

function getShanghaiWeekday(date: Date) {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
  }).format(date);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return weekdayMap[label] ?? date.getDay();
}

export function getTodaySchedule(date = new Date()): WeeklyScheduleItem {
  const weekday = getShanghaiWeekday(date);
  const item = weeklySchedule.find((schedule) => schedule.weekday === weekday);
  if (!item) {
    return {
      weekday,
      label: "今天",
      type: "none",
      title: "暂无固定安排",
      timeLabel: "",
    };
  }
  return item;
}

export function formatWeeklyScheduleLine(item: WeeklyScheduleItem) {
  if (item.type === "none") return `${item.label}：暂无固定安排`;
  return `${item.label} ${item.timeLabel}：${item.title}`;
}
