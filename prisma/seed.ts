/**
 * Seed script: loads the bundled sample VCF into the database so the app has
 * data to display on first run. Idempotent-ish: it always inserts a fresh
 * dataset named after the sample file.
 *
 * Run with: npm run db:seed
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { parseVcfText } from "../server/vcf/parser";

const prisma = new PrismaClient();

async function main() {
  const path = join(process.cwd(), "samples", "sample.vcf");
  const text = await readFile(path, "utf8");
  const variants = await parseVcfText(text);

  const dataset = await prisma.dataset.create({
    data: { filename: "sample.vcf" },
  });

  await prisma.variant.createMany({
    data: variants.map((v) => ({ ...v, datasetId: dataset.id })),
  });

  console.log(
    `Seeded dataset ${dataset.id} with ${variants.length} variants from sample.vcf`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
