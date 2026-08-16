"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CompetitionForm, CompetitionFormData } from "@/components/admin/CompetitionForm";
import {
  ArrowLeft,
  ArrowRight,
  Edit3,
  FileText,
  Play,
  Plus,
  Square,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdminCompetition {
  id: string;
  name: string;
  description: string | null;
  season: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  files: { id: string; name: string; url: string; type: string }[];
  _count: { matches: number; files: number };
}

const competitionStatusLabel: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  finished: "已结束",
  archived: "已归档",
};

export default function AdminCompetitionsPage() {
  const { data: competitions, mutate } = useSWR<AdminCompetition[]>(
    "/api/admin/competitions",
    fetcher,
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminCompetition | null>(null);

  const handleCreate = async (data: CompetitionFormData) => {
    const payload: Record<string, unknown> = { ...data };
    payload.startDate = data.startDate ? new Date(data.startDate).toISOString() : null;
    payload.endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
    const res = await fetch("/api/admin/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "创建失败");
    }
    mutate();
  };

  const handleUpdate = async (data: CompetitionFormData) => {
    if (!editing) return;
    const payload: Record<string, unknown> = { ...data };
    payload.startDate = data.startDate ? new Date(data.startDate).toISOString() : null;
    payload.endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
    const res = await fetch(`/api/admin/competitions/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "更新失败");
    }
    mutate();
    setEditing(null);
  };

  const handleStatusChange = async (compId: string, status: string) => {
    await fetch(`/api/admin/competitions/${compId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
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
          <h2 className="text-lg font-bold text-gray-900">赛事管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            点击赛事进入赛事工作区，管理队伍、比赛与资料。
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
          创建赛事
        </Button>
      </div>

      {(competitions?.length ?? 0) === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm">暂无赛事</div>
      ) : (
        <div className="space-y-3">
          {competitions?.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{c.name}</h3>
                  {c.season || c.description ? (
                    <p className="text-sm text-gray-500">
                      {[c.season, c.description].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <Badge
                  variant={
                    c.status === "ongoing"
                      ? "success"
                      : c.status === "finished" || c.status === "archived"
                        ? "default"
                        : "info"
                  }
                >
                  {competitionStatusLabel[c.status] || c.status}
                </Badge>
              </div>

              <div className="text-sm text-gray-500 mb-3">
                比赛 {c._count?.matches ?? 0} 场 · 资料 {c._count?.files ?? 0} 个
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/competitions/${c.id}`}>
                  <Button variant="secondary" size="sm">
                    进入赛事工作区
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(c);
                    setShowForm(true);
                  }}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  编辑
                </Button>
                {c.status === "upcoming" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(c.id, "ongoing")}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    开始
                  </Button>
                ) : c.status === "ongoing" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(c.id, "finished")}
                  >
                    <Square className="w-3.5 h-3.5 mr-1" />
                    结束
                  </Button>
                ) : null}
                {c._count?.files ? (
                  <Link
                    href={`/admin/competitions/${c.id}#files`}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    管理资料
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <CompetitionForm
          key={editing?.id ?? "create-competition"}
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={editing ? handleUpdate : handleCreate}
          initialData={editing as unknown as Record<string, string> | undefined}
          title={editing ? "编辑赛事" : "创建赛事"}
        />
      ) : null}
    </div>
  );
}
