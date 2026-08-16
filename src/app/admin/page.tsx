"use client";

import useSWR from "swr";
import Link from "next/link";
import { parseISO } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileText,
  Trophy,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AdminCompetition {
  id: string;
  name: string;
  season: string | null;
  status: string;
  _count: { matches: number; files: number };
}

interface AdminMatch {
  id: string;
  competitionId: string | null;
  startAt: string | null;
  status: string;
  teamA: { name: string };
  teamB: { name: string };
  competition: { id: string; name: string } | null;
}

const competitionStatusLabel: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  finished: "已结束",
  archived: "已归档",
};

export default function AdminWorkbenchPage() {
  const { data: competitions } = useSWR<AdminCompetition[]>(
    "/api/admin/competitions",
    fetcher,
  );
  const { data: matches } = useSWR<AdminMatch[]>("/api/admin/matches", fetcher);

  const activeCompetitions = (competitions ?? []).filter(
    (c) => c.status === "ongoing" || c.status === "upcoming",
  );
  const matchList = matches ?? [];

  const matchesOf = (competitionId: string) =>
    matchList.filter((m) => m.competitionId === competitionId);

  // 近期待办：从现有比赛状态推导，不建 Task 表
  const pendingMatches = matchList.filter((m) => m.status === "pending");
  const overdueMatches = matchList.filter(
    (m) =>
      m.status === "scheduled" && m.startAt && parseISO(m.startAt) < new Date(),
  );

  const quickLinks = [
    {
      href: "/admin/activities",
      label: "活动管理",
      desc: "发布野球、训练等活动信息",
      icon: CalendarDays,
    },
    {
      href: "/admin/competitions",
      label: "赛事管理",
      desc: "创建赛事，进入赛事工作区",
      icon: Trophy,
    },
    {
      href: "/admin/matches",
      label: "比赛管理",
      desc: "跨赛事补录比分、确认时间",
      icon: ClipboardList,
    },
    {
      href: "/admin/competitions",
      label: "资料管理",
      desc: "在赛事工作区上传与整理资料",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-5">
      {/* 当前赛事 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">当前赛事</h2>
        {activeCompetitions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <Trophy className="w-9 h-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">暂无进行中或即将开始的赛事</p>
            <Link
              href="/admin/competitions"
              className="inline-block mt-3 text-sm text-blue-600 hover:underline"
            >
              去创建赛事
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCompetitions.map((comp) => {
              const compMatches = matchesOf(comp.id);
              const finished = compMatches.filter(
                (m) => m.status === "finished",
              ).length;
              const pendingCount = compMatches.filter(
                (m) => m.status === "pending",
              ).length;
              const overdueCount = compMatches.filter(
                (m) =>
                  m.status === "scheduled" &&
                  m.startAt &&
                  parseISO(m.startAt) < new Date(),
              ).length;
              return (
                <div
                  key={comp.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {comp.name}
                        </h3>
                        <Badge
                          variant={comp.status === "ongoing" ? "success" : "info"}
                        >
                          {competitionStatusLabel[comp.status] || comp.status}
                        </Badge>
                      </div>
                      {comp.season ? (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {comp.season}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>
                      已完成：{finished} / {comp._count.matches} 场
                    </p>
                    <p>待确认时间：{pendingCount} 场</p>
                    <p>待录入比分：{overdueCount} 场</p>
                  </div>

                  <Link
                    href={`/admin/competitions/${comp.id}`}
                    className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 hover:underline"
                  >
                    进入赛事工作区
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 快捷入口 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">快捷入口</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
            >
              <link.icon className="w-5 h-5 text-blue-600 mb-2" />
              <p className="font-semibold text-gray-900 text-sm">{link.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-4">
                {link.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 近期待办 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">近期待办</h2>
        {pendingMatches.length === 0 && overdueMatches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-500">暂无待办事项</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {overdueMatches.slice(0, 4).map((m) => (
              <Link
                key={`overdue-${m.id}`}
                href={
                  m.competition
                    ? `/admin/competitions/${m.competition.id}#matches`
                    : "/admin/matches"
                }
                className="flex items-center gap-3 p-3.5 hover:bg-gray-50"
              >
                <span className="flex-none text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  补录
                </span>
                <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">
                  {m.teamA.name} VS {m.teamB.name} 比分
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-none" />
              </Link>
            ))}
            {pendingMatches.slice(0, 4).map((m) => (
              <Link
                key={`pending-${m.id}`}
                href={
                  m.competition
                    ? `/admin/competitions/${m.competition.id}#matches`
                    : "/admin/matches"
                }
                className="flex items-center gap-3 p-3.5 hover:bg-gray-50"
              >
                <span className="flex-none text-xs font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                  确认
                </span>
                <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">
                  {m.teamA.name} VS {m.teamB.name} 比赛时间
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 flex-none" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
