import { Badge, type BadgeProps } from "@/components/ui/badge";

/**
 * Map a free-text clinical significance classification to a semantic badge
 * colour. Falls back to a neutral badge for unknown values. Matching is
 * case-insensitive and substring-based so ClinVar variants like
 * "Likely pathogenic" and "Pathogenic/Likely pathogenic" both resolve.
 */
function variantForClassification(value: string): BadgeProps["variant"] {
  const v = value.toLowerCase();
  if (v.includes("pathogenic")) return "destructive";
  if (v.includes("benign")) return "success";
  if (v.includes("uncertain") || v.includes("conflicting")) return "warning";
  return "secondary";
}

export function ClinicalBadge({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <Badge variant={variantForClassification(value)}>{value}</Badge>;
}
