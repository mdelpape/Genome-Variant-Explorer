"use client";

import { use } from "react";
import Link from "next/link";
import { Dna, FileText, Table2 } from "lucide-react";
import { useDataset } from "@/hooks/use-datasets";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarList } from "@/components/dashboard/bar-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatNumber } from "@/utils/format";

export default function DatasetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, refetch } = useDataset(id);

  if (isError) {
    return (
      <ErrorState
        title="Dataset not found"
        description="This dataset may have been removed."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={data.filename}
        description={`Uploaded ${formatDateTime(data.uploadDate)}`}
        action={
          <Button asChild>
            <Link href={`/variants?datasetId=${data.id}`}>
              <Table2 className="h-4 w-4" />
              View variants
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Variants"
            value={formatNumber(data.variantCount)}
            icon={Dna}
          />
          <StatCard
            label="Chromosomes"
            value={formatNumber(data.chromosomeCount)}
            icon={FileText}
          />
          <StatCard
            label="Classifications"
            value={formatNumber(data.classifications.length)}
            icon={Dna}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BarList
            title="Top genes"
            description="Most frequent genes in this dataset"
            items={data.topGenes.map((g) => ({
              label: g.gene,
              value: g.count,
            }))}
            emptyLabel="No gene annotations"
          />
          <BarList
            title="Classifications"
            description="Clinical significance distribution"
            items={data.classifications.map((c) => ({
              label: c.classification,
              value: c.count,
            }))}
            emptyLabel="No classifications"
          />
        </div>
      </div>
    </>
  );
}
