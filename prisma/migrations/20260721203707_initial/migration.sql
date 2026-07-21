-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variants" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "chromosome" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "gene" TEXT,
    "reference" TEXT NOT NULL,
    "alternate" TEXT NOT NULL,
    "quality" DOUBLE PRECISION,
    "filter" TEXT,
    "info" TEXT NOT NULL DEFAULT '',
    "clinicalSignificance" TEXT,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "datasets_uploadDate_idx" ON "datasets"("uploadDate");

-- CreateIndex
CREATE INDEX "variants_datasetId_idx" ON "variants"("datasetId");

-- CreateIndex
CREATE INDEX "variants_gene_idx" ON "variants"("gene");

-- CreateIndex
CREATE INDEX "variants_chromosome_idx" ON "variants"("chromosome");

-- CreateIndex
CREATE INDEX "variants_position_idx" ON "variants"("position");

-- CreateIndex
CREATE INDEX "variants_clinicalSignificance_idx" ON "variants"("clinicalSignificance");

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
