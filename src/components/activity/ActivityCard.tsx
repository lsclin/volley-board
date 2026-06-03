"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActivityWithCounts } from "@/types";
import { formatActivityTime, isActivityActive } from "@/lib/time";
import { MapPin, Clock, Users, UserCheck, FileText } from "lucide-react";

interface ActivityCardProps {
  activity: ActivityWithCounts;
  onAttendanceUpdate?: () => void;
  showAttendance?: boolean;
  children?: React.ReactNode;
}

export function ActivityCard({
  activity,
  children,
}: ActivityCardProps) {
  const isActive = isActivityActive(activity.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {activity.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>
                {formatActivityTime(
                  new Date(activity.startAt),
                  new Date(activity.endAt),
                )}
              </span>
            </div>
          </div>
          <StatusBadge status={activity.status} />
        </div>
      </div>

      {/* Info rows */}
      <div className="px-5 pb-3 space-y-2">
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span>{activity.location}</span>
        </div>

        {activity.note ? (
          <div className="flex items-start gap-1.5 text-sm text-gray-600">
            <FileText className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
            <span>{activity.note}</span>
          </div>
        ) : null}

        {isActive ? (
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-sm">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-gray-500">预计</span>
              <span className="font-bold text-blue-600 text-lg">
                {activity.expectedCount}
              </span>
              <span className="text-gray-400 text-xs">人</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <UserCheck className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">已到</span>
              <span className="font-bold text-green-600 text-lg">
                {activity.arrivedCount}
              </span>
              <span className="text-gray-400 text-xs">人</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-sm">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">峰值到场</span>
              <span className="font-bold text-gray-700 text-lg">
                {activity.peakArrivedCount}
              </span>
              <span className="text-gray-400 text-xs">人</span>
            </div>
          </div>
        )}
      </div>

      {children ? (
        <div className="border-t border-gray-100 px-5 py-3">{children}</div>
      ) : null}
    </div>
  );
}