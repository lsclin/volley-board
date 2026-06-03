"use client";

import { useState } from "react";
import { useAdminAuth } from "@/lib/useAdminAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading } = useAdminAuth();
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
      <div className="max-w-sm mx-auto mt-16">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-1">管理员登录</h1>
          <p className="text-sm text-gray-500 mb-6">请输入管理密码</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="密码"
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
              登录
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">管理员后台</h1>
          <p className="text-sm text-gray-500">管理活动、比赛与排名</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" />
          退出
        </Button>
      </div>
      {children}
    </>
  );
}
