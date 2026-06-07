"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";

export interface CompetitionFormData {
  name: string;
  description: string;
  season: string;
  startDate: string;
  endDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CompetitionFormData) => Promise<void>;
  initialData?: Partial<CompetitionFormData>;
  title: string;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function getInitialCompetitionForm(
  initialData?: Partial<CompetitionFormData>,
): CompetitionFormData {
  return {
    name: initialData?.name || "",
    description: initialData?.description || "",
    season: initialData?.season || "",
    startDate: toDateInputValue(initialData?.startDate),
    endDate: toDateInputValue(initialData?.endDate),
  };
}

export function CompetitionForm({ open, onClose, onSubmit, initialData, title: formTitle }: Props) {
  const [form, setForm] = useState<CompetitionFormData>(() =>
    getInitialCompetitionForm(initialData),
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
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={formTitle}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="赛事名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="如：春季联赛" />
        <Input label="赛季" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="如：2026春" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="开始日期" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="结束日期" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">简介</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="赛事说明..." />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">取消</Button>
          <Button type="submit" loading={loading} className="flex-1">保存</Button>
        </div>
      </form>
    </Dialog>
  );
}
