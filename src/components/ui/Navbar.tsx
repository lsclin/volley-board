"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Bot, Volleyball, History, Calendar, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "看板", icon: Volleyball },
  { href: "/history", label: "历史", icon: History },
  { href: "/schedule", label: "赛事", icon: Calendar },
  { href: "/admin", label: "管理", icon: Settings },
  { href: "/admin/assistant", label: "助手", icon: Bot },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-56 md:fixed md:inset-y-0 md:border-r md:border-gray-200 md:bg-white md:px-3 md:py-4">
        <div className="flex items-center gap-2 px-3 py-2 mb-6">
          <Volleyball className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900">VolleyBoard</span>
        </div>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" || item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex justify-around items-center px-2 py-1.5 safe-area-bottom">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" || item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-[60px] transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Volleyball className="w-5 h-5 text-blue-600" />
          <span className="text-base font-bold text-gray-900">VolleyBoard</span>
        </div>
      </header>
    </>
  );
}
