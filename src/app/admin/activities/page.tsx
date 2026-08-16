"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActivityForm, ActivityFormData } from "@/components/admin/ActivityForm";
import { CopyAnnouncement } from "@/components/admin/CopyAnnouncement";
import { formatDateTime } from "@/lib/time";
import { ArrowLeft, Edit3, Play, Plus, Square, Trash2, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ActivityItem {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  location: string;
  note: string | null;
  status: string;
  visible: boolean;
}

const activityTypeLabel: Record<string, string> = {
  pickup: "野球",
  training: "训练",
  friendly: "友谊赛",
  match: "比赛",
};

function toFormData(a: ActivityItem): Partial<ActivityFormData> {
  const d = new Date(a.startAt);
  const localStart = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const e = new Date(a.endAt);
  const localEnd = new Date(e.getTime() - e.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return {
    title: a.title,
    type: a.type,
    startAt: localStart,
    endAt: localEnd,
    location: a.location,
    note: a.note || "",
    visible: a.visible,
  };
}

export default function AdminActivitiesPage() {
  const { data: activities, mutate } = useSWR<ActivityItem[]>(
    "/api/admin/activities",
    fetcher,
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ActivityItem | null>(null);

  const handleCreate = async (data: ActivityFormData) => {
    const res = await fetch("/api/admin/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建失败");
    }
    mutate();
  };

  const handleUpdate = async (data: ActivityFormData) => {
    if (!editing) return;
    const res = await fetch(`/api/admin/activities/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失败");
    }
    mutate();
    setEditing(null);
  };

  const handleStatusChange = async (activityId: string, status: string) => {
    await fetch(`/api/admin/activities/${activityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  };

  const handleDelete = async (activity: ActivityItem) => {
    if (!confirm(`确定删除活动「${activity.title}」吗？`)) return;
    const res = await fetch(`/api/admin/activities/${activity.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "删除活动失败");
      return;
    }
    mutate();
  };

  return (
    <div className="space-y-4">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        返回工作台
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">活动管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            发布活动信息（野球、训练、友谊赛等）。报名与接龙在 QQ 群进行。
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          创建活动
        </Button>
      </div>

      {(activities?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">暂无活动</div>
      ) : (
        <div className="space-y-3">
          {activities?.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {a.title}
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {activityTypeLabel[a.type] || a.type}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(new Date(a.startAt))} · {a.location}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {a.visible ? null : (
                    <span className="text-xs text-gray-400">已隐藏</span>
                  )}
                  <StatusBadge status={a.status} />
                </div>
              </div>

              {a.note ? (
                <p className="text-sm text-gray-400 mb-3">{a.note}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {a.status === "scheduled" || a.status === "live" ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditing(a);
                        setShowForm(true);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      编辑
                    </Button>
                    {a.status === "scheduled" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(a.id, "live")}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" />
                        开始
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(a.id, "ended")}
                      >
                        <Square className="w-3.5 h-3.5 mr-1" />
                        结束
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStatusChange(a.id, "cancelled")}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      取消
                    </Button>
                  </>
                ) : null}
                <CopyAnnouncement
                  activity={{
                    title: a.title,
                    startAt: new Date(a.startAt),
                    endAt: new Date(a.endAt),
                    location: a.location,
                    note: a.note,
                  }}
                />
                {a.status !== "live" ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(a)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    删除
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <ActivityForm
          key={editing?.id ?? "create-activity"}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={editing ? handleUpdate : handleCreate}
          initialData={editing ? toFormData(editing) : undefined}
          title={editing ? "编辑活动" : "创建活动"}
        />
      ) : null}
    </div>
  );
}
