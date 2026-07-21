"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DatasetDTO, DatasetStats, Paginated } from "@/types";

/** Paginated list of uploaded datasets. */
export function useDatasets(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ["datasets", { page, pageSize }],
    queryFn: () =>
      apiGet<Paginated<DatasetDTO>>("/api/datasets", { page, pageSize }),
  });
}

/** A single dataset with its statistics. */
export function useDataset(id: string) {
  return useQuery({
    queryKey: ["dataset", id],
    queryFn: () => apiGet<DatasetStats>(`/api/datasets/${id}`),
    enabled: Boolean(id),
  });
}
