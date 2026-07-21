"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { Pagination } from "@/components/shared/pagination";
import { VariantFilters } from "@/components/variants/variant-filters";
import { VariantsTable } from "@/components/variants/variants-table";
import {
  useVariantFilterOptions,
  useVariants,
} from "@/hooks/use-variants";
import { useDebounce } from "@/hooks/use-debounce";
import type { SortOrder, VariantSortField } from "@/types";

const PAGE_SIZE = 25;

export default function VariantsPage() {
  // useSearchParams requires a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <VariantsExplorer />
    </Suspense>
  );
}

function VariantsExplorer() {
  // Optional dataset scope passed via ?datasetId= from the dataset page.
  const searchParams = useSearchParams();
  const datasetId = searchParams.get("datasetId") ?? undefined;

  // Filter inputs (raw, debounced below for text fields).
  const [search, setSearch] = useState("");
  const [gene, setGene] = useState("");
  const [chromosome, setChromosome] = useState("");
  const [clinicalSignificance, setClinicalSignificance] = useState("");

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<VariantSortField>("position");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Debounce free-text inputs so we don't fire a request per keystroke.
  const debouncedSearch = useDebounce(search);
  const debouncedGene = useDebounce(gene);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      gene: debouncedGene || undefined,
      chromosome: chromosome || undefined,
      clinicalSignificance: clinicalSignificance || undefined,
      datasetId,
      sortBy,
      sortOrder,
    }),
    [
      page,
      debouncedSearch,
      debouncedGene,
      chromosome,
      clinicalSignificance,
      datasetId,
      sortBy,
      sortOrder,
    ],
  );

  const { data, isLoading, isError, isFetching, refetch } =
    useVariants(filters);
  const { data: options } = useVariantFilterOptions();

  const handleSort = (field: VariantSortField) => {
    if (field === sortBy) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Any filter change resets pagination to page 1.
  const updateFilters = (next: Partial<Record<string, string>>) => {
    if ("search" in next) setSearch(next.search ?? "");
    if ("gene" in next) setGene(next.gene ?? "");
    if ("chromosome" in next) setChromosome(next.chromosome ?? "");
    if ("clinicalSignificance" in next)
      setClinicalSignificance(next.clinicalSignificance ?? "");
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Variants"
        description="Search, filter and sort across every parsed variant."
      />

      <div className="space-y-4">
        <VariantFilters
          state={{ search, gene, chromosome, clinicalSignificance }}
          onChange={updateFilters}
          chromosomes={options?.chromosomes ?? []}
          clinicalSignificances={options?.clinicalSignificances ?? []}
        />

        {isError ? (
          <ErrorState
            description="Could not load variants."
            onRetry={() => refetch()}
          />
        ) : (
          <>
            <VariantsTable
              variants={data?.data ?? []}
              isLoading={isLoading || (isFetching && !data)}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            {data ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
