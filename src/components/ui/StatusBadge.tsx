import { Badge } from "@/components/ui/Badge";
import { ActivityStatus } from "@prisma/client";

const statusConfig: Record<string, { label: string; variant: "info" | "success" | "default" | "danger" | "warning" }> = {
  [ActivityStatus.scheduled]: { label: "即将开始", variant: "info" },
  [ActivityStatus.live]: { label: "进行中", variant: "success" },
  [ActivityStatus.ended]: { label: "已结束", variant: "default" },
  [ActivityStatus.cancelled]: { label: "已取消", variant: "danger" },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "default" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}