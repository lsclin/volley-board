"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ActivityForm, ActivityFormData } from "@/components/admin/ActivityForm";
import { MatchForm, MatchFormData } from "@/components/admin/MatchForm";
import { CopyAnnouncement } from "@/components/admin/CopyAnnouncement";
import { ActivityWithCounts } from "@/types";
import { formatDateTime } from "@/lib/time";
import { Plus, Edit3, Play, Square, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = "activities" | "matches" | "teams";

function toFormData(a: ActivityWithCounts): Partial<ActivityFormData> {
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

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("activities");
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityWithCounts | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Record<string, unknown> | null>(null);
  const [newTeamName, setNewTeamName] = useState("");

  const { data: activities, mutate: mutateActivities } = useSWR(
    "/api/admin/activities",
    fetcher,
  );
  const { data: matches, mutate: mutateMatches } = useSWR(
    "/api/admin/matches",
    fetcher,
  );
  const { data: teams, mutate: mutateTeams } = useSWR(
    "/api/admin/teams",
    fetcher,
  );

  // Activity actions
  const handleCreateActivity = async (data: ActivityFormData) => {
    const res = await fetch("/api/admin/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建失败");
    }
    mutateActivities();
  };

  const handleUpdateActivity = async (data: ActivityFormData) => {
    if (!editingActivity) return;
    const res = await fetch(`/api/admin/activities/${editingActivity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失败");
    }
    mutateActivities();
    setEditingActivity(null);
  };

  const handleStatusChange = async (
    activityId: string,
    status: string,
  ) => {
    await fetch(`/api/admin/activities/${activityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutateActivities();
  };

  // Match actions
  const handleCreateMatch = async (data: MatchFormData) => {
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建失败");
    }
    mutateMatches();
  };

  const handleUpdateMatch = async (data: MatchFormData) => {
    if (!editingMatch) return;
    const res = await fetch(`/api/admin/matches/${editingMatch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失败");
    }
    mutateMatches();
    setEditingMatch(null);
  };

  // Team actions
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });
    if (res.ok) {
      setNewTeamName("");
      mutateTeams();
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "activities", label: "活动管理" },
    { key: "matches", label: "比赛管理" },
    { key: "teams", label: "队伍管理" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Activities Tab */}
      {tab === "activities" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {activities?.length || 0} 场活动
            </span>
            <Button
              size="sm"
              onClick={() => setShowActivityForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              创建活动
            </Button>
          </div>

          {activities?.map((a: ActivityWithCounts) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(new Date(a.startAt))} · {a.location}
                  </p>
                </div>
                <Badge
                  variant={
                    a.status === "live"
                      ? "success"
                      : a.status === "scheduled"
                        ? "info"
                        : "default"
                  }
                >
                  {a.status === "scheduled"
                    ? "未开始"
                    : a.status === "live"
                      ? "进行中"
                      : a.status === "ended"
                        ? "已结束"
                        : "已取消"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>预计 {a.expectedCount} 人</span>
                <span>已到 {a.arrivedCount} 人</span>
                <span>峰值 {a.peakArrivedCount} 人</span>
              </div>

              {a.note ? (
                <p className="text-sm text-gray-400 mb-3">{a.note}</p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {(a.status === "scheduled" || a.status === "live") ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingActivity(a);
                        setShowActivityForm(true);
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
                    expectedCount: a.expectedCount,
                    arrivedCount: a.arrivedCount,
                  }}
                />
              </div>
            </div>
          ))}

          {showActivityForm ? (
            <ActivityForm
              key={editingActivity?.id ?? "create-activity"}
              open={showActivityForm}
              onClose={() => {
                setShowActivityForm(false);
                setEditingActivity(null);
              }}
              onSubmit={
                editingActivity ? handleUpdateActivity : handleCreateActivity
              }
              initialData={editingActivity ? toFormData(editingActivity) : undefined}
              title={editingActivity ? "编辑活动" : "创建活动"}
            />
          ) : null}
        </div>
      ) : null}

      {/* Matches Tab */}
      {tab === "matches" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {matches?.length || 0} 场比赛
            </span>
            <Button
              size="sm"
              onClick={() => setShowMatchForm(true)}
              disabled={!teams || teams.length < 2}
            >
              <Plus className="w-4 h-4 mr-1" />
              创建比赛
            </Button>
          </div>

          {!teams || teams.length < 2 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              请先在「队伍管理」中创建至少两个队伍
            </div>
          ) : null}

          {matches?.map((m: Record<string, unknown>) => (
            <div
              key={m.id as string}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {(m.teamA as Record<string, string>)?.name} vs{" "}
                    {(m.teamB as Record<string, string>)?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(new Date(m.startAt as string))} ·{" "}
                    {m.location as string}
                  </p>
                </div>
                <Badge
                  variant={
                    m.status === "finished"
                      ? "success"
                      : m.status === "scheduled"
                        ? "info"
                        : "default"
                  }
                >
                  {m.status === "scheduled"
                    ? "未开始"
                    : m.status === "finished"
                      ? "已结束"
                      : "已取消"}
                </Badge>
              </div>

              {(m.sets as unknown[])?.length > 0 ? (
                <div className="flex gap-2 mb-2">
                  {(m.sets as Array<Record<string, number>>).map(
                    (s, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-50 px-2 py-0.5 rounded"
                      >
                        R{s.setNo}: {s.scoreA}-{s.scoreB}
                      </span>
                    ),
                  )}
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingMatch(m);
                    setShowMatchForm(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  编辑比分
                </Button>
              </div>
            </div>
          ))}

          {showMatchForm ? (
            <MatchForm
              key={(editingMatch?.id as string | undefined) ?? "create-match"}
              open={showMatchForm}
              onClose={() => {
                setShowMatchForm(false);
                setEditingMatch(null);
              }}
              onSubmit={
                editingMatch ? handleUpdateMatch : handleCreateMatch
              }
              initialData={editingMatch || undefined}
              title={editingMatch ? "编辑比赛" : "创建比赛"}
              teams={(teams as Array<{ id: string; name: string }>) || []}
            />
          ) : null}
        </div>
      ) : null}

      {/* Teams Tab */}
      {tab === "teams" ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="输入队伍名称"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTeam();
              }}
            />
            <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              添加
            </Button>
          </div>

          {teams && teams.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {(teams as Array<{ id: string; name: string; note: string | null }>).map(
                (t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.name}</p>
                      {t.note ? (
                        <p className="text-sm text-gray-400">{t.note}</p>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm">
              暂无队伍，请添加
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
