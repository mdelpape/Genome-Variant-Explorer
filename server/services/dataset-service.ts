import { prisma } from "@/lib/prisma";
import type {
  DatasetDTO,
  DatasetStats,
  GeneCount,
  ClassificationCount,
  Paginated,
} from "@/types";

/**
 * Business logic for datasets: listing, per-dataset statistics, and the
 * aggregate rollups reused by the dashboard.
 */

const TOP_GENES_LIMIT = 10;

export async function listDatasets(
  page: number,
  pageSize: number,
): Promise<Paginated<DatasetDTO>> {
  const [total, rows] = await Promise.all([
    prisma.dataset.count(),
    prisma.dataset.findMany({
      orderBy: { uploadDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { variants: true } } },
    }),
  ]);

  return {
    data: rows.map(toDatasetDTO),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getDatasetStats(
  id: string,
): Promise<DatasetStats | null> {
  const dataset = await prisma.dataset.findUnique({
    where: { id },
    include: { _count: { select: { variants: true } } },
  });
  if (!dataset) return null;

  const [topGenes, classifications, chromosomes] = await Promise.all([
    topGenesFor({ datasetId: id }),
    classificationsFor({ datasetId: id }),
    prisma.variant.findMany({
      where: { datasetId: id },
      distinct: ["chromosome"],
      select: { chromosome: true },
    }),
  ]);

  return {
    ...toDatasetDTO(dataset),
    topGenes,
    classifications,
    chromosomeCount: chromosomes.length,
  };
}

/**
 * Aggregate the top gene symbols by variant count. Variants without a gene are
 * excluded. Scoped by `where` so the same helper serves both a single dataset
 * and the global dashboard.
 */
export async function topGenesFor(
  where: { datasetId?: string } = {},
): Promise<GeneCount[]> {
  const grouped = await prisma.variant.groupBy({
    by: ["gene"],
    where: { ...where, gene: { not: null } },
    _count: { gene: true },
    orderBy: { _count: { gene: "desc" } },
    take: TOP_GENES_LIMIT,
  });

  return grouped
    .filter((g) => g.gene !== null)
    .map((g) => ({ gene: g.gene as string, count: g._count.gene }));
}

/** Aggregate variant counts by clinical significance classification. */
export async function classificationsFor(
  where: { datasetId?: string } = {},
): Promise<ClassificationCount[]> {
  const grouped = await prisma.variant.groupBy({
    by: ["clinicalSignificance"],
    where: { ...where, clinicalSignificance: { not: null } },
    _count: { clinicalSignificance: true },
    orderBy: { _count: { clinicalSignificance: "desc" } },
  });

  return grouped
    .filter((g) => g.clinicalSignificance !== null)
    .map((g) => ({
      classification: g.clinicalSignificance as string,
      count: g._count.clinicalSignificance,
    }));
}

type DatasetRow = {
  id: string;
  filename: string;
  uploadDate: Date;
  _count: { variants: number };
};

function toDatasetDTO(row: DatasetRow): DatasetDTO {
  return {
    id: row.id,
    filename: row.filename,
    uploadDate: row.uploadDate.toISOString(),
    variantCount: row._count.variants,
  };
}
