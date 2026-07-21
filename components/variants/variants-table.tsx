"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableHeader } from "./sortable-header";
import { ClinicalBadge } from "@/components/shared/clinical-badge";
import { EmptyState } from "@/components/shared/states";
import { formatPosition, formatQuality, orDash } from "@/utils/format";
import type {
  SortOrder,
  VariantDTO,
  VariantSortField,
} from "@/types";

const COLUMN_COUNT = 8;

/**
 * The variants data grid. Rows are clickable and navigate to the variant
 * detail page. Sorting is delegated to the parent via `onSort`.
 */
export function VariantsTable({
  variants,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
}: {
  variants: VariantDTO[];
  isLoading: boolean;
  sortBy: VariantSortField;
  sortOrder: SortOrder;
  onSort: (field: VariantSortField) => void;
}) {
  const router = useRouter();

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHeader
              field="chromosome"
              label="Chrom"
              activeField={sortBy}
              order={sortOrder}
              onSort={onSort}
            />
            <SortableHeader
              field="position"
              label="Position"
              activeField={sortBy}
              order={sortOrder}
              onSort={onSort}
              className="text-right"
            />
            <SortableHeader
              field="gene"
              label="Gene"
              activeField={sortBy}
              order={sortOrder}
              onSort={onSort}
            />
            <TableHead>Ref</TableHead>
            <TableHead>Alt</TableHead>
            <SortableHeader
              field="quality"
              label="Qual"
              activeField={sortBy}
              order={sortOrder}
              onSort={onSort}
              className="text-right"
            />
            <TableHead>Filter</TableHead>
            <SortableHeader
              field="clinicalSignificance"
              label="Clinical significance"
              activeField={sortBy}
              order={sortOrder}
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : variants.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={COLUMN_COUNT} className="p-0">
                <EmptyState
                  title="No variants found"
                  description="Try adjusting your search or filters."
                />
              </TableCell>
            </TableRow>
          ) : (
            variants.map((variant) => (
              <TableRow
                key={variant.id}
                className="cursor-pointer"
                onClick={() => router.push(`/variants/${variant.id}`)}
              >
                <TableCell className="font-medium">
                  {variant.chromosome}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatPosition(variant.position)}
                </TableCell>
                <TableCell>{orDash(variant.gene)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {variant.reference}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {variant.alternate}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatQuality(variant.quality)}
                </TableCell>
                <TableCell>{orDash(variant.filter)}</TableCell>
                <TableCell>
                  <ClinicalBadge value={variant.clinicalSignificance} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
