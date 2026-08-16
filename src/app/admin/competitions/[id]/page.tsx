"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { parseISO } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  MatchForm,
  MatchFormData,
  MatchFormSubmitData,
} from "@/components/admin/MatchForm";
import {
  CompetitionForm,
  CompetitionFormData,
} from "@/components/admin/CompetitionForm";
import { CompetitionFilesPanel } from "@/components/admin/CompetitionFilesPanel";
import { formatDateTime } from "@/lib/time";
import { matchStatus } from "@/lib/matchStatus";
import { cn } from "@/lib/cn";
import {
  ArrowLeft,
  Bot,
  CalendarPlus,
  ClipboardList,
  Edit3,
  Play,
  Plus,
  Square,
  Trash2,
  Upload,
  UserPlus,
  XCircle,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WorkspaceTeam {
  id: string;
  name: string;
  note: string | null;
  _count: { matchesA: number; matchesB: number };
}

interface WorkspaceMatch {
  id: string;
  startAt: string | null;
  location: string;
  status: string;
  note: string | null;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

interface WorkspaceCompetition {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  teams: WorkspaceTeam[];
  matches: WorkspaceMatch[];
  files: { id: string; name: string; url: string; type: string }[];
}

const TABS = [
  { key: "overview", label: "概览" },
  { key: "teams", label: "队伍" },
  { key: "matches", label: "比赛" },
  { key: "files", label: "资料" },
  { key: "settings", label: "设置" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const competitionStatusLabel: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  finished: "已结束",
  archived: "已归档",
};

const MATCH_FILTERS = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待确认" },
  { key: "scheduled", label: "未开始" },
  { key: "finished", label: "已结束" },
  { key: "cancelled", label: "已取消" },
] as const;

type MatchFilterKey = (typeof MATCH_FILTERS)[number]["key"];

function toLocalDateTimeInput(date: string): string {
  const d = new Date(date);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toMatchFormData(
  m: WorkspaceMatch,
  competitionId: string,
): Partial<MatchFormData> {
  return {
    competitionId,
    startAt: m.startAt ? toLocalDateTimeInput(m.startAt) : "",
    location: m.location,
    teamAId: m.teamA.id,
    teamBId: m.teamB.id,
    note: m.note || "",
    sets: m.sets,
  };
}

export default function CompetitionWorkspacePage() {
  const params = useParams<{ id: string }>();
  const competitionId = params.id;

  const [tab, setTab] = useState<TabKey>("overview");
  const [matchFilter, setMatchFilter] = useState<MatchFilterKey>("all");
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<WorkspaceMatch | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [showSettingsForm, setShowSettingsForm] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.key === hash)) {
        setTab(hash as TabKey);
      }
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const switchTab = (next: TabKey) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${next}`);
    }
  };

  const { data: competition, mutate, isLoading } = useSWR<WorkspaceCompetition>(
    competitionId ? `/api/admin/competitions/${competitionId}` : null,
    fetcher,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-9 bg-gray-200 rounded-lg w-24 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!competition || "error" in competition) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/competitions"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          返回赛事管理
        </Link>
        <div className="text-center py-16 text-gray-500">赛事不存在或加载失败</div>
      </div>
    );
  }

  const matches = competition.matches;
  const finished = matches.filter((m) => m.status === "finished");
  const pending = matches.filter((m) => m.status === "pending");
  const overdue = matches.filter(
    (m) => m.status === "scheduled" && m.startAt && parseISO(m.startAt) < new Date(),
  );

  const matchFormTeams = competition.teams.map((t) => ({
    id: t.id,
    name: t.name,
    competitionId,
  }));
  const matchFormCompetitions = [{ id: competition.id, name: competition.name }];

  // ---- team actions ----
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const res = await fetch("/api/admin/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competitionId,
        name: newTeamName.trim(),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "创建队伍失败");
      return;
    }
    setNewTeamName("");
    mutate();
  };

  const handleTeamDelete = async (team: WorkspaceTeam) => {
    const matchCount = team._count.matchesA + team._count.matchesB;
    const detail =
      matchCount > 0
        ? `该队伍关联的 ${matchCount} 场比赛和对应局分也会一起删除。`
        : "该队伍当前没有关联比赛。";
    if (!confirm(`确定删除队伍「${team.name}」吗？${detail}`)) return;

    const res = await fetch(`/api/admin/teams/${team.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "删除队伍失败");
      return;
    }
    const result = await res.json().catch(() => null);
    if (result?.message && result?.deletedMatchCount > 0) {
      alert(result.message);
    }
    mutate();
  };

  // ---- match actions ----
  const handleCreateMatch = async (data: MatchFormSubmitData) => {
    const res = await fetch("/api/admin/matches", {
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

  const handleUpdateMatch = async (data: MatchFormSubmitData) => {
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
    mutate();
    setEditingMatch(null);
  };

  const handleMatchCancel = async (match: WorkspaceMatch) => {
    if (!confirm(`确定取消「${match.teamA.name} VS ${match.teamB.name}」吗？`)) return;
    await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    mutate();
  };

  const handleMatchDelete = async (match: WorkspaceMatch) => {
    if (!confirm(`确定删除「${match.teamA.name} VS ${match.teamB.name}」吗？局分也会一起删除。`)) {
      return;
    }
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      alert(err?.error || "删除比赛失败");
      return;
    }
    mutate();
  };

  // ---- competition settings actions ----
  const handleUpdateCompetition = async (data: CompetitionFormData) => {
    const payload: Record<string, unknown> = { ...data };
    payload.startDate = data.startDate ? new Date(data.startDate).toISOString() : null;
    payload.endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
    const res = await fetch(`/api/admin/competitions/${competition.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失败");
    }
    mutate();
  };

  const handleStatusChange = async (status: string) => {
    await fetch(`/api/admin/competitions/${competition.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  };

  const filteredMatches = matches.filter((m) =>
    matchFilter === "all" ? true : m.status === matchFilter,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/admin/competitions"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        赛事管理
      </Link>

      {/* 头部 */}
      <section className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {competition.name}
            </h1>
            {competition.season ? (
              <p className="text-sm text-gray-500 mt-0.5">{competition.season}</p>
            ) : null}
          </div>
          <Badge
            variant={
              competition.status === "ongoing"
                ? "success"
                : competition.status === "finished" ||
                    competition.status === "archived"
                  ? "default"
                  : "info"
            }
          >
            {competitionStatusLabel[competition.status] || competition.status}
          </Badge>
        </div>
      </section>

      {/* 工作区 Tab */}
      <div className="sticky top-[53px] z-20 -mx-1 px-1 py-1 bg-gray-50">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => switchTab(t.key)}
              className={cn(
                "flex-1 whitespace-nowrap py-1.5 px-3 rounded-md text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 概览 */}
      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <p className="text-xs text-gray-500">总比赛</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {matches.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <p className="text-xs text-gray-500">已完成</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">
                {finished.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <p className="text-xs text-gray-500">待确认时间</p>
              <p className="text-xl font-bold text-yellow-600 mt-0.5">
                {pending.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3.5">
              <p className="text-xs text-gray-500">待录入比分</p>
              <p className="text-xl font-bold text-red-500 mt-0.5">
                {overdue.length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">快捷操作</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => switchTab("teams")}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                添加队伍
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingMatch(null);
                  setShowMatchForm(true);
                }}
                disabled={competition.teams.length < 2}
              >
                <CalendarPlus className="w-4 h-4 mr-1" />
                添加比赛
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => switchTab("matches")}
              >
                <ClipboardList className="w-4 h-4 mr-1" />
                录入比分
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => switchTab("files")}
              >
                <Upload className="w-4 h-4 mr-1" />
                上传资料
              </Button>
            </div>
            {competition.teams.length < 2 ? (
              <p className="mt-2 text-xs text-yellow-700">
                至少需要两支队伍才能创建比赛。
              </p>
            ) : null}
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 px-1">最近比赛</h3>
            {matches.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
                暂无比赛
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {[...pending]
                  .concat(
                    [...matches]
                      .filter((m) => m.startAt)
                      .sort(
                        (a, b) =>
                          parseISO(b.startAt!).getTime() -
                          parseISO(a.startAt!).getTime(),
                      ),
                  )
                  .slice(0, 5)
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setEditingMatch(m);
                        setShowMatchForm(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-gray-50"
                    >
                      <span
                        className={cn(
                          "flex-none text-xs text-gray-400 w-16 truncate",
                        )}
                      >
                        {m.startAt
                          ? formatDateTime(parseISO(m.startAt))
                          : "时间待确认"}
                      </span>
                      <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">
                        {m.teamA.name} VS {m.teamB.name}
                      </span>
                      <span className={matchStatus.badge(m.status)}>
                        {matchStatus.label(m.status)}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 px-1">
              当前队伍（{competition.teams.length}）
            </h3>
            {competition.teams.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-sm text-gray-500">
                暂无队伍
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                  {competition.teams.map((team) => (
                    <span
                      key={team.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700"
                    >
                      {team.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {/* 队伍 */}
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

          {competition.teams.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {competition.teams.map((team) => {
                const matchCount = team._count.matchesA + team._count.matchesB;
                return (
                  <div
                    key={team.id}
                    className="p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{team.name}</p>
                      <p className="text-sm text-gray-400">
                        关联比赛 {matchCount} 场
                      </p>
                      {team.note ? (
                        <p className="text-sm text-gray-400">{team.note}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTeamDelete(team)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      aria-label={`删除 ${team.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-sm">
              该赛事暂无队伍，请添加
            </div>
          )}
        </div>
      ) : null}

      {/* 比赛 */}
      {tab === "matches" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {matches.length} 场比赛
            </span>
            <Button
              size="sm"
              onClick={() => {
                setEditingMatch(null);
                setShowMatchForm(true);
              }}
              disabled={competition.teams.length < 2}
            >
              <Plus className="w-4 h-4 mr-1" />
              添加比赛
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {MATCH_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setMatchFilter(f.key)}
                className={cn(
                  "flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  matchFilter === f.key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              该分组下暂无比赛
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMatches.map((m) => (
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
                        setEditingMatch(m);
                        setShowMatchForm(true);
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMatchCancel(m)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        取消
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleMatchDelete(m)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* 资料 */}
      {tab === "files" ? (
        <CompetitionFilesPanel
          competitionId={competition.id}
          files={competition.files}
          onChanged={() => mutate()}
        />
      ) : null}

      {/* 设置 */}
      {tab === "settings" ? (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">赛事设置</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSettingsForm(true)}
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" />
              编辑赛事信息
            </Button>
            <div className="flex flex-wrap gap-2">
              {competition.status === "upcoming" ? (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("ongoing")}
                >
                  <Play className="w-3.5 h-3.5 mr-1" />
                  开始赛事
                </Button>
              ) : competition.status === "ongoing" ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusChange("finished")}
                  >
                    <Square className="w-3.5 h-3.5 mr-1" />
                    结束赛事
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange("archived")}
                  >
                    归档
                  </Button>
                </>
              ) : null}
            </div>
            <Link
              href={`/admin/assistant?competitionId=${competition.id}`}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <Bot className="w-4 h-4" />
              用 Agent 助手处理本赛事（带赛事上下文）
            </Link>
          </div>
        </div>
      ) : null}

      {showMatchForm ? (
        <MatchForm
          key={editingMatch?.id ?? "create-match"}
          open={showMatchForm}
          onClose={() => {
            setShowMatchForm(false);
            setEditingMatch(null);
          }}
          onSubmit={editingMatch ? handleUpdateMatch : handleCreateMatch}
          initialData={
            editingMatch
              ? toMatchFormData(editingMatch, competition.id)
              : undefined
          }
          title={editingMatch ? "编辑比赛" : "创建比赛"}
          teams={matchFormTeams}
          competitions={matchFormCompetitions}
          defaultCompetitionId={competition.id}
        />
      ) : null}

      {showSettingsForm ? (
        <CompetitionForm
          key="edit-competition"
          open={showSettingsForm}
          onClose={() => setShowSettingsForm(false)}
          onSubmit={handleUpdateCompetition}
          initialData={
            {
              name: competition.name,
              description: competition.description || "",
              season: competition.season || "",
              startDate: competition.startDate
                ? toLocalDateTimeInput(competition.startDate)
                : "",
              endDate: competition.endDate
                ? toLocalDateTimeInput(competition.endDate)
                : "",
            } as unknown as Record<string, string>
          }
          title="编辑赛事"
        />
      ) : null}
    </div>
  );
}
