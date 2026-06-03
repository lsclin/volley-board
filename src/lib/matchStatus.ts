export const matchStatus = {
  label(status: string): string {
    const map: Record<string, string> = {
      scheduled: "未开始",
      finished: "已结束",
      cancelled: "已取消",
    };
    return map[status] || status;
  },
  badge(status: string): string {
    const map: Record<string, string> = {
      scheduled:
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800",
      finished:
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800",
      cancelled:
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-700";
  },
};