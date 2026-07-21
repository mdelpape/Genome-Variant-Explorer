/**
 * Shared application types.
 *
 * These are the DTOs exchanged between the REST API and the frontend. They are
 * intentionally decoupled from the Prisma model types so the API surface can
 * evolve independently of the database schema.
 */

export interface VariantDTO {
  id: string;
  datasetId: string;
  chromosome: string;
  position: number;
  gene: string | null;
  reference: string;
  alternate: string;
  quality: number | null;
  filter: string | null;
  info: string;
  clinicalSignificance: string | null;
}

export interface DatasetDTO {
  id: string;
  filename: string;
  uploadDate: string; // ISO string
  variantCount: number;
}

export interface GeneCount {
  gene: string;
  count: number;
}

export interface ClassificationCount {
  classification: string;
  count: number;
}

export interface DatasetStats extends DatasetDTO {
  topGenes: GeneCount[];
  chromosomeCount: number;
  classifications: ClassificationCount[];
}

export interface DashboardStats {
  totalDatasets: number;
  totalVariants: number;
  topGenes: GeneCount[];
  classifications: ClassificationCount[];
  recentDatasets: DatasetDTO[];
}

/** Generic paginated envelope returned by list endpoints. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type SortOrder = "asc" | "desc";

export type VariantSortField =
  | "chromosome"
  | "position"
  | "gene"
  | "quality"
  | "clinicalSignificance";

/** Result of parsing a single VCF file. */
export interface ParsedVariant {
  chromosome: string;
  position: number;
  gene: string | null;
  reference: string;
  alternate: string;
  quality: number | null;
  filter: string | null;
  info: string;
  clinicalSignificance: string | null;
}
