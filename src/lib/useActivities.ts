"use client";

import useSWR from "swr";
import { ActivityWithCounts } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getRefreshInterval(activities?: ActivityWithCounts[]) {
  if (!activities) return 15000;
  if (activities.some((activity) => activity.status === "live")) return 10000;
  if (activities.length > 0) return 30000;
  return 60000;
}

export function useActivities() {
  const { data, error, isLoading, mutate } = useSWR<ActivityWithCounts[]>(
    "/api/activities",
    fetcher,
    {
      refreshInterval: getRefreshInterval,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      focusThrottleInterval: 10000,
      dedupingInterval: 5000,
      keepPreviousData: true,
      isPaused: () =>
        typeof document !== "undefined" && document.visibilityState === "hidden",
    },
  );

  return {
    activities: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
