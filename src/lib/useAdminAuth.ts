"use client";

import useSWR from "swr";

interface AdminSession {
  isAdmin: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAdminAuth() {
  const { data, error, isLoading, mutate } = useSWR<AdminSession>(
    "/api/admin/me",
    fetcher,
  );

  return {
    isAdmin: !!data?.isAdmin,
    isLoading,
    isError: !!error,
    checkAuth: mutate,
  };
}