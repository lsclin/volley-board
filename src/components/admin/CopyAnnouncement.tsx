"use client";

import { Button } from "@/components/ui/Button";
import { generateAnnouncement } from "@/lib/announcement";
import { Copy } from "lucide-react";

interface CopyAnnouncementProps {
  activity: {
    title: string;
    startAt: Date;
    endAt: Date;
    location: string;
    note?: string | null;
  };
}

export function CopyAnnouncement({ activity }: CopyAnnouncementProps) {
  const handleCopy = async () => {
    const text = generateAnnouncement({
      title: activity.title,
      startAt: new Date(activity.startAt),
      endAt: new Date(activity.endAt),
      location: activity.location,
      note: activity.note,
      boardUrl: window.location.origin,
    });

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
