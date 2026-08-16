"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Plus, Trash2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
  competitionId: string | null;
}

interface Competition {
  id: string;
  name: string;
}

export interface MatchFormData {
  competitionId: string;
  /** 空字符串 = 时间待确认（pending） */
  startAt: string;
  location: string;
  teamAId: string;
  teamBId: string;
  note: string;
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

/** 提交给后端的结构：startAt 为 null 表示时间待确认 */
export type MatchFormSubmitData = Omit<MatchFormData, "startAt"> & {
  startAt: string | null;
};

interface MatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MatchFormSubmitData) => Promise<void>;
  initialData?: Partial<MatchFormData>;
  title: string;
  teams: Team[];
  competitions: Competition[];
  defaultCompetitionId?: string;
}

function toLocalDatetimeString(date: Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getDefaultMatchForm(defaultCompetitionId = ""): MatchFormData {
  return {
    competitionId: defaultCompetitionId,
    startAt: "",
    location: "",
    teamAId: "",
    teamBId: "",
    note: "",
    sets: [],
  };
}

function getInitialMatchForm(
  initialData?: Partial<MatchFormData>,
  defaultCompetitionId = "",
): MatchFormData {
  if (!initialData) return getDefaultMatchForm(defaultCompetitionId);

  return {
    competitionId: initialData.competitionId || "",
    startAt: initialData.startAt
      ? toLocalDatetimeString(new Date(initialData.startAt))
      : "",
    location: initialData.location || "",
    teamAId: initialData.teamAId || "",
    teamBId: initialData.teamBId || "",
    note: initialData.note || "",
    sets: initialData.sets || [],
  };
}

export function MatchForm({
  open,
  onClose,
  onSubmit,
  initialData,
  title: formTitle,
  teams,
  competitions,
  defaultCompetitionId: preferredCompetitionId,
}: MatchFormProps) {
  const defaultCompetitionId =
    initialData?.competitionId || preferredCompetitionId || competitions[0]?.id || "";
  const [form, setForm] = useState<MatchFormData>(() =>
    getInitialMatchForm(initialData, defaultCompetitionId),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const filteredTeams = form.competitionId
    ? teams.filter((team) => team.competitionId === form.competitionId)
    : [];
  const selectedLegacyTeams = teams.filter(
    (team) =>
      (team.id === form.teamAId || team.id === form.teamBId) &&
      !filteredTeams.some((item) => item.id === team.id),
  );
  const teamOptions = [...filteredTeams, ...selectedLegacyTeams];

  const addSet = () => {
    setForm({
      ...form,
      sets: [
        ...form.sets,
        {
          setNo: form.sets.length + 1,
          scoreA: 0,
          scoreB: 0,
        },
      ],
    });
  };

  const updateSet = (
    index: number,
    field: "scoreA" | "scoreB",
    value: number,
  ) => {
    const newSets = [...form.sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setForm({ ...form, sets: newSets });
  };

  const removeSet = (index: number) => {
    const newSets = form.sets
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, setNo: i + 1 }));
    setForm({ ...form, sets: newSets });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.teamAId === form.teamBId) {
      setError("比赛双方不能是同一队");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={formTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            所属赛事
          </label>
          <select
            value={form.competitionId}
            onChange={(e) =>
              setForm({
                ...form,
                competitionId: e.target.value,
                teamAId: "",
                teamBId: "",
              })
            }
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">选择赛事</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {form.competitionId && filteredTeams.length < 2 ? (
            <p className="mt-1.5 text-sm text-yellow-700">
              该赛事下还不足两个队伍，请先到队伍管理添加。
            </p>
          ) : null}
        </div>
        <div>
          <Input
            label="比赛时间"
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
          <p className="mt-1 text-xs text-gray-400">
            留空表示「时间待确认」，队伍确定后再补充。
          </p>
        </div>
        <Input
          label="地点"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
          placeholder="室内排球场"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              队伍 A
            </label>
            <select
              value={form.teamAId}
              onChange={(e) => setForm({ ...form, teamAId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">选择队伍</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.competitionId !== form.competitionId ? "（历史队伍）" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              队伍 B
            </label>
            <select
              value={form.teamBId}
              onChange={(e) => setForm({ ...form, teamBId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">选择队伍</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.competitionId !== form.competitionId ? "（历史队伍）" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              局分
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSet}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              加一局
            </Button>
          </div>
          {form.sets.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              暂未添加局分，可点击上方按钮添加
            </p>
          ) : (
            <div className="space-y-2">
              {form.sets.map((set, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-12">
                    第{set.setNo}局
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={set.scoreA}
                    onChange={(e) =>
                      updateSet(i, "scoreA", parseInt(e.target.value) || 0)
                    }
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                  />
                  <span className="text-gray-400">:</span>
                  <input
                    type="number"
                    min={0}
                    value={set.scoreB}
                    onChange={(e) =>
                      updateSet(i, "scoreB", parseInt(e.target.value) || 0)
                    }
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSet(i)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">备注</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            rows={2}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            取消
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            保存
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
