"use client";

import useSWR from "swr";
import { ActivityWithCounts } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useActivities() {
  const { data, error, isLoading, mutate } = useSWR<ActivityWithCounts[]>(
    "/api/activities",
    fetcher,
    {
      refreshInterval: 4000,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );

  return {
    activities: data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}