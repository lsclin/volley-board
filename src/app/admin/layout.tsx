"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { BookOpen, Bot, LayoutDashboard, LogOut } from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "工作台", icon: LayoutDashboard },
  { href: "/admin/assistant", label: "Agent 助手", icon: Bot },
  { href: "/admin/manual", label: "使用手册", icon: BookOpen },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdminAuth();
  const pathname = usePathname();
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        setLoginError(data.error || "登录失败");
      }
    } catch {
      setLoginError("网络错误");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto mt-10 px-2">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-1">管理员登录</h1>
          <p className="text-sm text-gray-500 mb-6">进入后台维护赛事、活动与资料</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="管理员密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理密码"
              error={loginError}
              autoFocus
            />
            <Button
              type="submit"
              size="lg"
              loading={loggingIn}
              className="w-full"
            >
              进入管理后台
            </Button>
          </form>
          <p className="mt-4 text-xs leading-5 text-gray-400">
            本网站无成员账号体系。所有人看到同一套公开页面，只有输入管理员密码后才能进入后台。
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">管理员后台</h1>
          <p className="text-sm text-gray-500">赛事与活动维护工作台</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" />
          退出
        </Button>
      </div>
      <nav className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-[40px] flex-none items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}
