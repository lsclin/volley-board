"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";

export interface ActivityFormData {
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  location: string;
  note: string;
  visible: boolean;
}

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  initialData?: Partial<ActivityFormData>;
  title: string;
}

function toLocalDatetimeString(date: Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function getDefaultActivityForm(): ActivityFormData {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    title: "今晚野球",
    type: "pickup",
    startAt: `${today}T19:00`,
    endAt: `${today}T21:00`,
    location: "",
    note: "",
    visible: true,
  };
}

function getInitialActivityForm(
  initialData?: Partial<ActivityFormData>,
): ActivityFormData {
  if (!initialData) return getDefaultActivityForm();

  return {
    title: initialData.title || "今晚野球",
    type: initialData.type || "pickup",
    startAt: initialData.startAt
      ? toLocalDatetimeString(new Date(initialData.startAt))
      : "",
    endAt: initialData.endAt
      ? toLocalDatetimeString(new Date(initialData.endAt))
      : "",
    location: initialData.location || "",
    note: initialData.note || "",
    visible: initialData.visible ?? true,
  };
}

export function ActivityForm({
  open,
  onClose,
  onSubmit,
  initialData,
  title: formTitle,
}: ActivityFormProps) {
  const [form, setForm] = useState<ActivityFormData>(() =>
    getInitialActivityForm(initialData),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit(form);
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
          label="标题"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            类型
          </label>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "pickup", label: "野球" },
              { value: "training", label: "训练" },
              { value: "friendly", label: "友谊赛" },
              { value: "match", label: "比赛" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm({ ...form, type: t.value })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.type === t.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="开始时间"
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            required
          />
          <Input
            label="结束时间"
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            required
          />
        </div>
        <Input
          label="地点"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
          placeholder="如：东区排球场"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">备注</label>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[44px]"
            rows={2}
            placeholder="如：新手友好"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm({ ...form, visible: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">公开显示</span>
        </label>

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
