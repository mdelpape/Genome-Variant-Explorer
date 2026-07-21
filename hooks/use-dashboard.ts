"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DashboardStats } from "@/types";

/** Fetch the aggregate dashboard rollup. */
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardStats>("/api/dashboard"),
  });
}
