"use client";

import { useSyncExternalStore } from "react";
import {
  getTodaySchedule,
  type WeeklyScheduleItem,
} from "@/config/weeklySchedule";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const initialTick = window.setTimeout(callback, 0);
  const interval = window.setInterval(callback, 60 * 60 * 1000);

  return () => {
    window.clearTimeout(initialTick);
    window.clearInterval(interval);
  };
}

function getServerScheduleSnapshot(): WeeklyScheduleItem | null {
  return null;
}

export function useTodaySchedule() {
  return useSyncExternalStore<WeeklyScheduleItem | null>(
    subscribe,
    getTodaySchedule,
    getServerScheduleSnapshot,
  );
}
