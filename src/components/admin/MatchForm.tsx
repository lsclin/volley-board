"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Plus, Trash2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
}

export interface MatchFormData {
  startAt: string;
  location: string;
  teamAId: string;
  teamBId: string;
  note: string;
  sets: { setNo: number; scoreA: number; scoreB: number }[];
}

interface MatchFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MatchFormData) => Promise<void>;
  initialData?: Partial<MatchFormData>;
  title: string;
  teams: Team[];
}

function toLocalDatetimeString(date: Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getDefaultMatchForm(): MatchFormData {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    startAt: `${today}T19:00`,
    location: "",
    teamAId: "",
    teamBId: "",
    note: "",
    sets: [],
  };
}

function getInitialMatchForm(
  initialData?: Partial<MatchFormData>,
): MatchFormData {
  if (!initialData) return getDefaultMatchForm();

  return {
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
}: MatchFormProps) {
  const [form, setForm] = useState<MatchFormData>(() =>
    getInitialMatchForm(initialData),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        startAt: new Date(form.startAt).toISOString(),
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
        <Input
          label="比赛时间"
          type="datetime-local"
          value={form.startAt}
          onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          required
        />
        <Input
          label="地点"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
          placeholder="如：东区排球场 1 号场"
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
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
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
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
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
