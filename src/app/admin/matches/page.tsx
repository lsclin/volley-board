"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import {
  MatchForm,
  MatchFormData,
  MatchFormSubmitData,
} from "@/components/admin/MatchForm";
import { formatDateTime } from "@/lib/time";
import { matchStatus } from "@/lib/matchStatus";
import { cn } from "@/lib/cn";
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdminMatch {
  id: string;
  competitionId: string | null;
  startAt: string | null;
  location: string;
  status: string;
  note: string | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  competition: { id: string; name: string } | null;
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

interface AdminTeam {
  id: string;
  competitionId: string | null;
  name: string;
}

interface AdminCompetition {
  id: string;
  name: string;
}

const STATUS_FILTERS = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "scheduled", label: "未开始" },
  { key: "finished", label: "已结束" },
  { key: "cancelled", label: "已取消" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["key"];

function toLocalDateTimeInput(date: string): string {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toMatchFormData(m: AdminMatch): Partial<MatchFormData> {
  return {
    competitionId: m.competitionId || "",
    startAt: m.startAt ? toLocalDateTimeInput(m.startAt) : "",
    location: m.location,
    teamAId: m.teamA.id,
    teamBId: m.teamB.id,
    note: m.note || "",
    sets: m.sets,
  };
}

export default function AdminMatchesPage() {
  const [competitionFilter, setCompetitionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminMatch | null>(null);

  const { data: matches, mutate: mutateMatches } = useSWR<AdminMatch[]>(
    `/api/admin/matches${competitionFilter ? `?competitionId=${competitionFilter}` : ""}`,
    fetcher,
  );
  const { data: teams } = useSWR<AdminTeam[]>("/api/admin/teams", fetcher);
  const { data: competitions } = useSWR<AdminCompetition[]>(
    "/api/admin/competitions",
    fetcher,
  );

  const teamList = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    competitionId: t.competitionId,
  }));
  const competitionOptions = (competitions ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const visibleMatches = (matches ?? []).filter((m) =>
    statusFilter === "all" ? true : m.status === statusFilter,
  );

  const handleCreate = async (data: MatchFormSubmitData) => {
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

  const handleUpdate = async (data: MatchFormSubmitData) => {
    if (!editing) return;
    const res = await fetch(`/api/admin/matches/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失败");
    }
    mutateMatches();
    setEditing(null);
  };

  const handleCancel = async (m: AdminMatch) => {
    if (!confirm(`确定取消「${m.teamA.name} VS ${m.teamB.name}」吗？`)) return;
    await fetch(`/api/admin/matches/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    mutateMatches();
  };

  const handleDelete = async (m: AdminMatch) => {
    if (!confirm(`确定删除「${m.teamA.name} VS ${m.teamB.name}」吗？局分也会一起删除。`)) {
      return;
    }
    const res = await fetch(`/api/admin/matches/${m.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "删除比赛失败");
      return;
    }
    mutateMatches();
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
          <h2 className="text-lg font-bold text-gray-900">比赛管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            跨赛事查看比赛，补录比分或确认时间。
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
          创建比赛
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <select
          value={competitionFilter}
          onChange={(e) => setCompetitionFilter(e.target.value)}
          className="min-h-[44px] rounded-lg border border-gray-300 px-3 py-2.5 text-base text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全部赛事</option>
          {competitionOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                statusFilter === f.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visibleMatches.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">暂无比赛</div>
      ) : (
        <div className="space-y-2">
          {visibleMatches.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {m.teamA.name} VS {m.teamB.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {m.startAt
                      ? `${formatDateTime(parseISO(m.startAt))} · `
                      : "时间待确认 · "}
                    {m.location}
                    {m.competition ? ` · ${m.competition.name}` : ""}
                  </p>
                </div>
                <span className={matchStatus.badge(m.status)}>
                  {matchStatus.label(m.status)}
                </span>
              </div>

              {m.sets.length > 0 ? (
                <div className="flex gap-2 flex-wrap mb-2">
                  {m.sets.map((s) => (
                    <span
                      key={s.setNo}
                      className="text-xs bg-gray-50 px-2 py-0.5 rounded"
                    >
                      第{s.setNo}局 {s.scoreA}:{s.scoreB}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditing(m);
                    setShowForm(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  {m.status === "finished" || m.sets.length > 0
                    ? "编辑比分"
                    : m.status === "pending"
                      ? "确认时间"
                      : "编辑"}
                </Button>
                {m.status === "pending" || m.status === "scheduled" ? (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(m)}>
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    取消
                  </Button>
                ) : null}
                {m.competition ? (
                  <Link
                    href={`/admin/competitions/${m.competition.id}#matches`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600"
                  >
                    进入赛事工作区
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                ) : null}
                <Button variant="danger" size="sm" onClick={() => handleDelete(m)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <MatchForm
          key={editing?.id ?? "create-match"}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={editing ? handleUpdate : handleCreate}
          initialData={editing ? toMatchFormData(editing) : undefined}
          title={editing ? "编辑比赛" : "创建比赛"}
          teams={teamList}
          competitions={competitionOptions}
          defaultCompetitionId={competitionFilter || undefined}
        />
      ) : null}
    </div>
  );
}
