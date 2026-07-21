/**
 * Pure display-formatting helpers. No React, no side effects — safe to unit
 * test and reuse anywhere on the client or server.
 */

const numberFormatter = new Intl.NumberFormat("en-US");

/** Format an integer with thousands separators (e.g. 12345 -> "12,345"). */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** Format a genomic position with thousands separators. */
export function formatPosition(position: number): string {
  return numberFormatter.format(position);
}

/** Format a nullable quality score to two decimals, or an em dash if absent. */
export function formatQuality(quality: number | null): string {
  if (quality === null || Number.isNaN(quality)) return "—";
  return quality.toFixed(2);
}

/** Format an ISO date string as a human-readable date. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format an ISO date string as date + time. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Render a possibly-empty value with an em-dash fallback. */
export function orDash(value: string | null | undefined): string {
  return value && value.length > 0 ? value : "—";
}
