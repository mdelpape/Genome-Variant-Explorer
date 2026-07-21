import { cn } from "@/lib/utils";

/**
 * Minimal determinate progress bar (0-100). Kept dependency-free rather than
 * pulling in @radix-ui/react-progress for a single linear indicator.
 */
export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
