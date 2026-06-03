"use client";

import useSWR from "swr";
import { HistoryStats } from "@/types";
import { formatDate, formatActivityTime } from "@/lib/time";
import { MapPin, Users, Calendar, Clock, BarChart3 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HistoryPage() {
  const { data, isLoading } = useSWR<HistoryStats>("/api/stats", fetcher);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">历史记录</h1>
        <p className="text-sm text-gray-500 mt-0.5">已结束的活动统计</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stats overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span>活动次数</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.totalActivities}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Users className="w-4 h-4" />
                <span>场均到场</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.avgArrived} 人</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span>常用场地</span>
              </div>
              <p className="text-lg font-bold text-gray-900 truncate">{data.topLocation || "-"}</p>
              <p className="text-xs text-gray-400">{data.topLocationCount} 次</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <Clock className="w-4 h-4" />
                <span>热门时段</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {data.topHour ? `${data.topHour}:00` : "-"}
              </p>
              <p className="text-xs text-gray-400">{data.topHourCount} 次</p>
            </div>
          </div>

          {/* Activity list */}
          {data.activities.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-500 px-1">
                所有活动 ({data.activities.length})
              </h2>
              {data.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(new Date(activity.startAt))}{" "}
                        {formatActivityTime(
                          new Date(activity.startAt),
                          new Date(activity.endAt),
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        预计 {activity.expectedCount} / 峰值 {activity.peakArrivedCount}
                      </span>
                    </div>
                  </div>
                  {activity.note ? (
                    <p className="mt-2 text-sm text-gray-400">{activity.note}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">加载失败，请刷新重试</p>
        </div>
      )}
    </div>
  );
}
