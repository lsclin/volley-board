import { format } from "date-fns";

/**
 * 生成活动通知文案（QQ 群公告）。
 * 通知只包含时间、地点与说明；报名与野球接龙在 QQ 群内进行，网站不做签到。
 */
export function generateAnnouncement(data: {
  title: string;
  startAt: Date;
  endAt: Date;
  location: string;
  note?: string | null;
  boardUrl?: string;
}): string {
  const { title, startAt, endAt, location, note, boardUrl } = data;

  const startText = `${format(startAt, "M月d日")} ${format(startAt, "HH:mm")}`;
  const endText = `${format(endAt, "M月d日")} ${format(endAt, "HH:mm")}`;

  let text = `${title}\n时间：${startText} - ${endText}\n地点：${location}`;

  if (note) {
    text += `\n${note}`;
  }

  if (boardUrl) {
    text += `\n活动详情：${boardUrl}`;
  }

  return text;
}
