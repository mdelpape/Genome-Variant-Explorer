"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type {
  Paginated,
  SortOrder,
  VariantDTO,
  VariantSortField,
} from "@/types";

export interface VariantFilters {
  page: number;
  pageSize: number;
  search?: string;
  chromosome?: string;
  gene?: string;
  clinicalSignificance?: string;
  datasetId?: string;
  sortBy: VariantSortField;
  sortOrder: SortOrder;
}

/**
 * Paginated, filtered, sorted variant list. `keepPreviousData` avoids a
 * flash of empty state while paging or refiltering.
 */
export function useVariants(filters: VariantFilters) {
  return useQuery({
    queryKey: ["variants", filters],
    queryFn: () => apiGet<Paginated<VariantDTO>>("/api/variants", filters),
    placeholderData: keepPreviousData,
  });
}

/** A single variant by id. */
export function useVariant(id: string) {
  return useQuery({
    queryKey: ["variant", id],
    queryFn: () => apiGet<VariantDTO>(`/api/variants/${id}`),
    enabled: Boolean(id),
  });
}

export interface VariantFilterOptions {
  chromosomes: string[];
  clinicalSignificances: string[];
}

/** Distinct filter option lists for the facet dropdowns. */
export function useVariantFilterOptions() {
  return useQuery({
    queryKey: ["variant-filters"],
    queryFn: () => apiGet<VariantFilterOptions>("/api/variants/filters"),
    staleTime: 60_000,
  });
}
