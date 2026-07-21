import type { ParsedVariant } from "@/types";

/**
 * VCF (Variant Call Format) parser.
 *
 * The parser is deliberately tolerant: it skips `##` metadata lines it does not
 * understand, reads the `#CHROM` header to locate columns, and extracts the
 * eight standard fixed columns. From the INFO column it best-effort extracts a
 * gene symbol and a clinical significance classification.
 *
 * Everything is exposed as an async generator over lines so that arbitrarily
 * large files can be streamed from disk / the network without being buffered
 * fully in memory.
 */

/** The eight fixed VCF columns, in order. */
const FIXED_COLUMNS = [
  "CHROM",
  "POS",
  "ID",
  "REF",
  "ALT",
  "QUAL",
  "FILTER",
  "INFO",
] as const;

/** INFO keys, in priority order, that commonly carry a gene symbol. */
const GENE_KEYS = ["GENE", "GENE_NAME", "GENENAME", "GENEINFO", "GeneName"];

/** INFO keys that commonly carry a clinical significance classification. */
const CLNSIG_KEYS = ["CLNSIG", "CLIN_SIG", "CLNSIGCONF"];

/**
 * Missing-value sentinel per the VCF spec. A single "." means "no value".
 */
function isMissing(value: string | undefined): boolean {
  return value === undefined || value === "" || value === ".";
}

/**
 * Parse the INFO column into a key/value map.
 *
 * INFO is a semicolon-delimited list of `key=value` pairs and bare flags
 * (which we record with an empty-string value). Values may themselves contain
 * commas; we keep them verbatim.
 */
export function parseInfo(info: string): Record<string, string> {
  const map: Record<string, string> = {};
  if (isMissing(info)) return map;

  for (const entry of info.split(";")) {
    if (!entry) continue;
    const eq = entry.indexOf("=");
    if (eq === -1) {
      map[entry] = "";
    } else {
      map[entry.slice(0, eq)] = entry.slice(eq + 1);
    }
  }
  return map;
}

/**
 * Extract a gene symbol from the parsed INFO map.
 *
 * Order of preference:
 *   1. A dedicated gene key (GENE, GENE_NAME, ...).
 *   2. The `gene_name` sub-field of a snpEff / VEP style ANN annotation.
 *
 * ANN format: `Allele|Annotation|Impact|Gene_Name|Gene_ID|...`, and the column
 * may hold several comma-separated annotations. We read the first one.
 */
export function extractGene(info: Record<string, string>): string | null {
  for (const key of GENE_KEYS) {
    const value = info[key];
    if (!isMissing(value)) {
      // GENEINFO is often "SYMBOL:id"; keep the symbol only.
      return value.split(":")[0].split(",")[0].trim() || null;
    }
  }

  const ann = info["ANN"] ?? info["EFF"] ?? info["CSQ"];
  if (!isMissing(ann)) {
    const firstAnnotation = ann.split(",")[0];
    const fields = firstAnnotation.split("|");
    // ANN gene symbol lives at index 3.
    const gene = fields[3]?.trim();
    if (!isMissing(gene)) return gene;
  }

  return null;
}

/**
 * Extract a clinical significance classification from the parsed INFO map.
 * ClinVar encodes underscores for spaces (e.g. `Likely_pathogenic`); we
 * normalise those back to spaces for display.
 */
export function extractClinicalSignificance(
  info: Record<string, string>,
): string | null {
  for (const key of CLNSIG_KEYS) {
    const value = info[key];
    if (!isMissing(value)) {
      return value.replace(/_/g, " ").split(",")[0].trim() || null;
    }
  }
  return null;
}

/**
 * Locate the index of each fixed column from a `#CHROM` header line.
 * Returns null if the line is not a usable header.
 */
export function parseHeader(line: string): Record<string, number> | null {
  if (!line.startsWith("#CHROM")) return null;
  const cols = line.replace(/^#/, "").split("\t");
  const index: Record<string, number> = {};
  cols.forEach((name, i) => {
    index[name.toUpperCase()] = i;
  });
  return index;
}

/**
 * Parse one data line into a ParsedVariant, or null if the line is malformed
 * or represents a missing chromosome/position (which we cannot key on).
 */
export function parseVariantLine(
  line: string,
  columns: Record<string, number>,
): ParsedVariant | null {
  const fields = line.split("\t");

  const chromosome = fields[columns.CHROM ?? 0]?.trim();
  const rawPosition = fields[columns.POS ?? 1]?.trim();
  const position = Number.parseInt(rawPosition, 10);

  if (isMissing(chromosome) || Number.isNaN(position)) {
    return null;
  }

  const reference = fields[columns.REF ?? 3]?.trim() ?? "";
  const alternate = fields[columns.ALT ?? 4]?.trim() ?? "";

  const rawQual = fields[columns.QUAL ?? 5]?.trim();
  const quality = isMissing(rawQual) ? null : Number.parseFloat(rawQual);

  const rawFilter = fields[columns.FILTER ?? 6]?.trim();
  const filter = isMissing(rawFilter) ? null : rawFilter;

  const rawInfo = fields[columns.INFO ?? 7]?.trim() ?? "";
  const info = isMissing(rawInfo) ? "" : rawInfo;
  const infoMap = parseInfo(info);

  return {
    chromosome,
    position,
    reference,
    alternate,
    quality: quality !== null && Number.isNaN(quality) ? null : quality,
    filter,
    info,
    gene: extractGene(infoMap),
    clinicalSignificance: extractClinicalSignificance(infoMap),
  };
}

/**
 * Turn a Web ReadableStream of bytes into an async iterator of lines,
 * decoding UTF-8 incrementally and splitting on newlines. Handles chunk
 * boundaries that fall in the middle of a line.
 */
export async function* streamLines(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        yield buffer.slice(0, newlineIndex).replace(/\r$/, "");
        buffer = buffer.slice(newlineIndex + 1);
      }
    }
    buffer += decoder.decode();
    if (buffer.length > 0) {
      yield buffer.replace(/\r$/, "");
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Stream-parse variants from an async iterable of lines.
 *
 * Metadata (`##`) lines are ignored. The first `#CHROM` line establishes the
 * column layout. If no header is present we fall back to the standard fixed
 * ordering so headerless files still parse.
 */
export async function* parseVariantLines(
  lines: AsyncIterable<string>,
): AsyncGenerator<ParsedVariant> {
  let columns: Record<string, number> | null = null;

  for await (const raw of lines) {
    const line = raw.trimEnd();
    if (line === "") continue;

    if (line.startsWith("##")) continue; // metadata

    if (line.startsWith("#")) {
      columns = parseHeader(line);
      continue;
    }

    // Data line before any header: assume standard column ordering.
    if (!columns) {
      columns = Object.fromEntries(FIXED_COLUMNS.map((c, i) => [c, i]));
    }

    const variant = parseVariantLine(line, columns);
    if (variant) yield variant;
  }
}

/**
 * Convenience wrapper: parse a Web ReadableStream directly into variants.
 */
export function parseVcfStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ParsedVariant> {
  return parseVariantLines(streamLines(stream));
}

/**
 * Parse a VCF string fully into memory. Handy for tests and small files.
 */
export async function parseVcfText(text: string): Promise<ParsedVariant[]> {
  async function* lines() {
    for (const line of text.split("\n")) yield line;
  }
  const out: ParsedVariant[] = [];
  for await (const variant of parseVariantLines(lines())) out.push(variant);
  return out;
}
