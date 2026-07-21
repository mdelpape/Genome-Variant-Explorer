import Link from "next/link";
import { FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { formatDateTime, formatNumber } from "@/utils/format";
import type { DatasetDTO } from "@/types";

/** List of the most recently uploaded datasets, each linking to its page. */
export function RecentDatasets({ datasets }: { datasets: DatasetDTO[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recently uploaded</CardTitle>
        <CardDescription>Latest datasets added to the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {datasets.length === 0 ? (
          <EmptyState
            title="No datasets yet"
            description="Upload a VCF file to get started."
            icon={<FileText className="h-6 w-6" />}
          />
        ) : (
          <ul className="divide-y">
            {datasets.map((dataset) => (
              <li key={dataset.id}>
                <Link
                  href={`/datasets/${dataset.id}`}
                  className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {dataset.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(dataset.uploadDate)}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatNumber(dataset.variantCount)} variants
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
