import { prisma } from "@/lib/prisma";
import { parseVcfStream } from "@/server/vcf/parser";
import type { ParsedVariant } from "@/types";

/**
 * Upload ingestion pipeline.
 *
 * Creates a Dataset row, stream-parses the uploaded VCF, and bulk-inserts the
 * resulting variants in batches. Streaming + batching keeps memory flat and the
 * database round-trips bounded regardless of file size.
 *
 * The whole operation is atomic at the dataset level: if parsing yields zero
 * variants (i.e. the file was not a valid VCF) the empty dataset is removed and
 * an error is thrown, so we never persist junk uploads.
 */

const INSERT_BATCH_SIZE = 1_000;

export interface IngestResult {
  datasetId: string;
  variantCount: number;
}

export class EmptyVcfError extends Error {
  constructor() {
    super("No variants were found in the uploaded file.");
    this.name = "EmptyVcfError";
  }
}

export async function ingestVcf(
  filename: string,
  stream: ReadableStream<Uint8Array>,
): Promise<IngestResult> {
  const dataset = await prisma.dataset.create({ data: { filename } });

  let batch: ParsedVariant[] = [];
  let variantCount = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    await prisma.variant.createMany({
      data: batch.map((v) => ({ ...v, datasetId: dataset.id })),
    });
    variantCount += batch.length;
    batch = [];
  };

  try {
    for await (const variant of parseVcfStream(stream)) {
      batch.push(variant);
      if (batch.length >= INSERT_BATCH_SIZE) {
        await flush();
      }
    }
    await flush();
  } catch (error) {
    // Roll back the dataset (cascade removes any inserted variants) so a
    // failed parse does not leave a partial record behind.
    await prisma.dataset.delete({ where: { id: dataset.id } }).catch(() => {});
    throw error;
  }

  if (variantCount === 0) {
    await prisma.dataset.delete({ where: { id: dataset.id } }).catch(() => {});
    throw new EmptyVcfError();
  }

  return { datasetId: dataset.id, variantCount };
}
