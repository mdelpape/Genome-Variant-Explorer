import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { formatNumber } from "@/utils/format";

export interface BarListItem {
  label: string;
  value: number;
}

/**
 * A labelled horizontal bar list used for "Top genes" and "Variant
 * classifications". Bars are scaled relative to the largest value in the set.
 */
export function BarList({
  title,
  description,
  items,
  emptyLabel = "No data yet",
}: {
  title: string;
  description?: string;
  items: BarListItem[];
  emptyLabel?: string;
}) {
  const max = items.reduce((m, i) => Math.max(m, i.value), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState title={emptyLabel} />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatNumber(item.value)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${max === 0 ? 0 : (item.value / max) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
