import { parseInfo } from "@/server/vcf/parser";

/**
 * Render a raw VCF INFO string as a readable key/value grid, with the original
 * string preserved below for reference. Flags (valueless keys) render as a
 * "present" marker.
 */
export function InfoTable({ info }: { info: string }) {
  const entries = Object.entries(parseInfo(info));

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No INFO fields.</p>;
  }

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col border-b border-dashed py-1.5"
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {key}
            </dt>
            <dd className="break-words font-mono text-sm">
              {value === "" ? (
                <span className="text-muted-foreground">present</span>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <details className="rounded-lg bg-muted/50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Raw INFO string
        </summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs">
          {info}
        </pre>
      </details>
    </div>
  );
}
