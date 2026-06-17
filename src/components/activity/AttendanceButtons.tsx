"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { getClientId } from "@/lib/clientId";
import { User, UserCheck } from "lucide-react";

interface AttendanceButtonsProps {
  activityId: string;
  currentStatus?: string | null;
  onUpdate: (newStatus: string) => void;
  disabled?: boolean;
}

export function AttendanceButtons({
  activityId,
  currentStatus,
  onUpdate,
  disabled = false,
}: AttendanceButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAttendance = async (status: string) => {
    if (loading || disabled) return;
    const nextStatus = currentStatus === status ? "cancelled" : status;
    setLoading(status);

    try {
      const clientId = getClientId();
      const res = await fetch(`/api/activities/${activityId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "操作失败");
        return;
      }

      onUpdate(nextStatus);
    } catch {
      alert("网络错误，请重试");
    } finally {
      setLoading(null);
    }
  };

  const isExpected = currentStatus === "expected";
  const isArrived = currentStatus === "arrived";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          variant={isExpected ? "primary" : "secondary"}
          size="sm"
          onClick={() => handleAttendance("expected")}
          loading={loading === "expected"}
          disabled={disabled}
          className="flex-1 flex-col py-3 gap-1 h-auto"
        >
          <User className="w-4 h-4" />
          <span className="text-xs">会来</span>
          {isExpected ? (
            <span className="text-[10px] opacity-70">再点取消</span>
          ) : null}
        </Button>

        <Button
          variant={isArrived ? "primary" : "secondary"}
          size="sm"
          onClick={() => handleAttendance("arrived")}
          loading={loading === "arrived"}
          disabled={disabled}
          className="flex-1 flex-col py-3 gap-1 h-auto"
        >
          <UserCheck className="w-4 h-4" />
          <span className="text-xs">到了</span>
          {isArrived ? (
            <span className="text-[10px] opacity-70">再点取消</span>
          ) : null}
        </Button>
      </div>
      <p className="text-xs leading-5 text-gray-500">
        “会来”表示准备来但还没到，“到了”表示已经在场地。无需登录，同一浏览器只记录一次，再次点击可取消。
      </p>
    </div>
  );
}
