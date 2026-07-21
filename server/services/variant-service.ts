import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Paginated, VariantDTO } from "@/types";
import type { VariantQuery } from "@/server/validation/schemas";

/**
 * Read-side business logic for variants. Keeps Prisma query construction out of
 * the route handlers so the API layer stays thin and the logic is testable.
 */

/** Build the Prisma `where` clause from validated query filters. */
function buildWhere(query: VariantQuery): Prisma.VariantWhereInput {
  const where: Prisma.VariantWhereInput = {};

  if (query.datasetId) where.datasetId = query.datasetId;
  if (query.chromosome) where.chromosome = query.chromosome;
  if (query.clinicalSignificance) {
    where.clinicalSignificance = query.clinicalSignificance;
  }
  if (query.gene) {
    where.gene = { contains: query.gene, mode: "insensitive" };
  }

  // Free-text search spans gene, chromosome and reference/alternate alleles.
  if (query.search) {
    where.OR = [
      { gene: { contains: query.search, mode: "insensitive" } },
      { chromosome: { contains: query.search, mode: "insensitive" } },
      { reference: { contains: query.search, mode: "insensitive" } },
      { alternate: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listVariants(
  query: VariantQuery,
): Promise<Paginated<VariantDTO>> {
  const where = buildWhere(query);

  // Secondary sort on position keeps ordering stable when the primary key ties.
  const orderBy: Prisma.VariantOrderByWithRelationInput[] = [
    { [query.sortBy]: query.sortOrder },
    ...(query.sortBy !== "position"
      ? [{ position: "asc" as const }]
      : []),
  ];

  const [total, rows] = await Promise.all([
    prisma.variant.count({ where }),
    prisma.variant.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return {
    data: rows,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getVariantById(id: string): Promise<VariantDTO | null> {
  return prisma.variant.findUnique({ where: { id } });
}

/**
 * Distinct filter option lists that power the variants-table facets. Bounded so
 * the dropdowns stay usable even on very large datasets.
 */
export async function getVariantFilterOptions(): Promise<{
  chromosomes: string[];
  clinicalSignificances: string[];
}> {
  const [chromosomes, classifications] = await Promise.all([
    prisma.variant.findMany({
      distinct: ["chromosome"],
      select: { chromosome: true },
      orderBy: { chromosome: "asc" },
      take: 200,
    }),
    prisma.variant.findMany({
      where: { clinicalSignificance: { not: null } },
      distinct: ["clinicalSignificance"],
      select: { clinicalSignificance: true },
      orderBy: { clinicalSignificance: "asc" },
      take: 200,
    }),
  ]);

  return {
    chromosomes: chromosomes.map((c) => c.chromosome),
    clinicalSignificances: classifications
      .map((c) => c.clinicalSignificance)
      .filter((c): c is string => c !== null),
  };
}
