import { z } from "zod";

/**
 * Zod schemas that validate and coerce incoming API request parameters.
 * Route handlers parse `URLSearchParams` through these so the rest of the
 * server code works with well-typed, bounded values.
 */

const PAGE_SIZE_MAX = 100;

/** Shared pagination coercion used by list endpoints. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).catch(25),
});

export const variantSortFieldSchema = z
  .enum(["chromosome", "position", "gene", "quality", "clinicalSignificance"])
  .catch("position");

export const sortOrderSchema = z.enum(["asc", "desc"]).catch("asc");

/**
 * Query schema for `GET /api/variants`. Empty filter strings are normalised to
 * `undefined` so they are ignored when building the Prisma `where` clause.
 */
export const variantQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional().transform(emptyToUndefined),
  chromosome: z.string().trim().optional().transform(emptyToUndefined),
  gene: z.string().trim().optional().transform(emptyToUndefined),
  clinicalSignificance: z
    .string()
    .trim()
    .optional()
    .transform(emptyToUndefined),
  datasetId: z.string().trim().optional().transform(emptyToUndefined),
  sortBy: variantSortFieldSchema,
  sortOrder: sortOrderSchema,
});

export type VariantQuery = z.infer<typeof variantQuerySchema>;

/** Query schema for `GET /api/datasets`. */
export const datasetQuerySchema = paginationSchema;

/** Accepted MIME types / extensions for uploaded VCF files. */
export const VCF_EXTENSIONS = [".vcf", ".vcf.txt"];

/**
 * Validate an uploaded file's metadata (not its contents). Content validity is
 * enforced by the parser, which rejects files that yield zero variants.
 */
export const uploadFileSchema = z.object({
  filename: z
    .string()
    .min(1, "A filename is required")
    .refine(
      (name) => VCF_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext)),
      { message: "Only .vcf files are supported" },
    ),
  size: z.number().int().positive("Uploaded file is empty"),
});

function emptyToUndefined(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

/** Parse a plain object of search params through a schema. */
export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  params: URLSearchParams,
): z.infer<T> {
  return schema.parse(Object.fromEntries(params.entries()));
}
