"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useVariant } from "@/hooks/use-variants";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { DefinitionList } from "@/components/shared/definition-list";
import { ClinicalBadge } from "@/components/shared/clinical-badge";
import { InfoTable } from "@/components/variants/info-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPosition, formatQuality, orDash } from "@/utils/format";

export default function VariantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: variant, isLoading, isError, refetch } = useVariant(id);

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/variants">
            <ArrowLeft className="h-4 w-4" />
            Back to variants
          </Link>
        </Button>
      </div>

      {isError ? (
        <ErrorState
          title="Variant not found"
          description="This variant may have been removed."
          onRetry={() => refetch()}
        />
      ) : isLoading || !variant ? (
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <PageHeader
            title={
              variant.gene
                ? `${variant.gene} · chr${variant.chromosome}:${formatPosition(
                    variant.position,
                  )}`
                : `chr${variant.chromosome}:${formatPosition(variant.position)}`
            }
            description={`${variant.reference} → ${variant.alternate}`}
            action={<ClinicalBadge value={variant.clinicalSignificance} />}
          />

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic information</CardTitle>
              </CardHeader>
              <CardContent>
                <DefinitionList
                  items={[
                    { label: "Chromosome", value: variant.chromosome },
                    {
                      label: "Position",
                      value: formatPosition(variant.position),
                    },
                    { label: "Gene", value: orDash(variant.gene) },
                    {
                      label: "Reference",
                      value: (
                        <span className="font-mono">{variant.reference}</span>
                      ),
                    },
                    {
                      label: "Alternate",
                      value: (
                        <span className="font-mono">{variant.alternate}</span>
                      ),
                    },
                    {
                      label: "Quality",
                      value: formatQuality(variant.quality),
                    },
                    { label: "Filter", value: orDash(variant.filter) },
                    {
                      label: "Clinical significance",
                      value: (
                        <ClinicalBadge value={variant.clinicalSignificance} />
                      ),
                    },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">INFO field</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoTable info={variant.info} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
