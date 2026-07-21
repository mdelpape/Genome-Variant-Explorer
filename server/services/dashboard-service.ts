import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/types";
import { classificationsFor, topGenesFor } from "./dataset-service";

const RECENT_DATASETS_LIMIT = 5;

/**
 * Compose the dashboard rollup from the individual aggregate helpers. Runs the
 * independent queries concurrently.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalDatasets, totalVariants, topGenes, classifications, recent] =
    await Promise.all([
      prisma.dataset.count(),
      prisma.variant.count(),
      topGenesFor(),
      classificationsFor(),
      prisma.dataset.findMany({
        orderBy: { uploadDate: "desc" },
        take: RECENT_DATASETS_LIMIT,
        include: { _count: { select: { variants: true } } },
      }),
    ]);

  return {
    totalDatasets,
    totalVariants,
    topGenes,
    classifications,
    recentDatasets: recent.map((d) => ({
      id: d.id,
      filename: d.filename,
      uploadDate: d.uploadDate.toISOString(),
      variantCount: d._count.variants,
    })),
  };
}
