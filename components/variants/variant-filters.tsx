"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Sentinel used because Radix Select cannot hold an empty-string value. */
const ALL = "__all__";

export interface VariantFilterState {
  search: string;
  gene: string;
  chromosome: string;
  clinicalSignificance: string;
}

/**
 * Filter toolbar for the variants table: free-text search, gene contains,
 * chromosome facet and clinical significance facet, plus a clear-all button.
 */
export function VariantFilters({
  state,
  onChange,
  chromosomes,
  clinicalSignificances,
}: {
  state: VariantFilterState;
  onChange: (next: Partial<VariantFilterState>) => void;
  chromosomes: string[];
  clinicalSignificances: string[];
}) {
  const hasActiveFilters =
    state.search || state.gene || state.chromosome || state.clinicalSignificance;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search gene, chromosome or allele…"
          className="pl-9"
        />
      </div>

      <Input
        value={state.gene}
        onChange={(e) => onChange({ gene: e.target.value })}
        placeholder="Gene"
        className="md:w-40"
      />

      <Select
        value={state.chromosome || ALL}
        onValueChange={(value) =>
          onChange({ chromosome: value === ALL ? "" : value })
        }
      >
        <SelectTrigger className="md:w-40">
          <SelectValue placeholder="Chromosome" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All chromosomes</SelectItem>
          {chromosomes.map((c) => (
            <SelectItem key={c} value={c}>
              chr {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={state.clinicalSignificance || ALL}
        onValueChange={(value) =>
          onChange({ clinicalSignificance: value === ALL ? "" : value })
        }
      >
        <SelectTrigger className="md:w-56">
          <SelectValue placeholder="Clinical significance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All classifications</SelectItem>
          {clinicalSignificances.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange({
              search: "",
              gene: "",
              chromosome: "",
              clinicalSignificance: "",
            })
          }
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
