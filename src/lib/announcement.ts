export function generateAnnouncement(data: {
  title: string;
  startAt: Date;
  endAt: Date;
  location: string;
  expectedCount: number;
  arrivedCount: number;
  boardUrl?: string;
}): string {
  const { title, startAt, endAt, location, expectedCount, arrivedCount, boardUrl } = data;

  const hours = String(startAt.getHours()).padStart(2, "0");
  const mins = String(startAt.getMinutes()).padStart(2, "0");
  const endHours = String(endAt.getHours()).padStart(2, "0");
  const endMins = String(endAt.getMinutes()).padStart(2, "0");

  let text = `${title}\n时间：${hours}:${mins}-${endHours}:${endMins}\n地点：${location}\n当前预计：${expectedCount} 人，已到：${arrivedCount} 人`;

  if (boardUrl) {
    text += `\n看板链接：${boardUrl}`;
  }

  return text;
}