"use client";

import { Button } from "@/components/ui/Button";
import { Copy } from "lucide-react";

interface CopyAnnouncementProps {
  activity: {
    title: string;
    startAt: Date;
    endAt: Date;
    location: string;
    expectedCount: number;
    arrivedCount: number;
  };
}

export function CopyAnnouncement({ activity }: CopyAnnouncementProps) {
  const handleCopy = async () => {
    const start = new Date(activity.startAt);
    const end = new Date(activity.endAt);
    const sh = String(start.getHours()).padStart(2, "0");
    const sm = String(start.getMinutes()).padStart(2, "0");
    const eh = String(end.getHours()).padStart(2, "0");
    const em = String(end.getMinutes()).padStart(2, "0");

    const text = [
      activity.title,
      `时间：${sh}:${sm}-${eh}:${em}`,
      `地点：${activity.location}`,
      `当前预计：${activity.expectedCount} 人，已到：${activity.arrivedCount} 人`,
      `看板链接：${window.location.origin}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      alert("已复制到剪贴板");
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("已复制到剪贴板");
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      <Copy className="w-4 h-4 mr-1" />
      复制群公告
    </Button>
  );
}