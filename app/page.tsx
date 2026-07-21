"use client";

import Link from "next/link";
import { Database, Dna, FileText, Upload } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { BarList } from "@/components/dashboard/bar-list";
import { RecentDatasets } from "@/components/dashboard/recent-datasets";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/utils/format";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your genomic variant datasets."
        action={
          <Button asChild>
            <Link href="/upload">
              <Upload className="h-4 w-4" />
              Upload VCF
            </Link>
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          description="Could not load dashboard statistics."
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-6">
          {/* Headline metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading || !data ? (
              Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))
            ) : (
              <>
                <StatCard
                  label="Datasets"
                  value={formatNumber(data.totalDatasets)}
                  icon={FileText}
                  hint="Uploaded VCF files"
                />
                <StatCard
                  label="Variants"
                  value={formatNumber(data.totalVariants)}
                  icon={Dna}
                  hint="Total parsed records"
                />
                <StatCard
                  label="Distinct genes"
                  value={formatNumber(data.topGenes.length)}
                  icon={Database}
                  hint="Shown in top genes"
                />
                <StatCard
                  label="Classifications"
                  value={formatNumber(data.classifications.length)}
                  icon={Dna}
                  hint="Clinical significance types"
                />
              </>
            )}
          </div>

          {/* Breakdowns */}
          <div className="grid gap-4 lg:grid-cols-2">
            {isLoading || !data ? (
              <>
                <Skeleton className="h-72 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
              </>
            ) : (
              <>
                <BarList
                  title="Top genes"
                  description="Most frequently observed genes across all datasets"
                  items={data.topGenes.map((g) => ({
                    label: g.gene,
                    value: g.count,
                  }))}
                  emptyLabel="No gene annotations yet"
                />
                <BarList
                  title="Variant classifications"
                  description="Clinical significance distribution"
                  items={data.classifications.map((c) => ({
                    label: c.classification,
                    value: c.count,
                  }))}
                  emptyLabel="No classifications yet"
                />
              </>
            )}
          </div>

          {/* Recent uploads */}
          {isLoading || !data ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <RecentDatasets datasets={data.recentDatasets} />
          )}
        </div>
      )}
    </>
  );
}
