"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortOrder, VariantSortField } from "@/types";

/**
 * A clickable column header that cycles the table sort. Clicking the active
 * column toggles direction; clicking a new column sorts it ascending.
 */
export function SortableHeader({
  field,
  label,
  activeField,
  order,
  onSort,
  className,
}: {
  field: VariantSortField;
  label: string;
  activeField: VariantSortField;
  order: SortOrder;
  onSort: (field: VariantSortField) => void;
  className?: string;
}) {
  const isActive = activeField === field;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 font-medium transition-colors hover:text-foreground",
          isActive && "text-foreground",
        )}
      >
        {label}
        {!isActive ? (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        ) : order === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>
    </TableHead>
  );
}
