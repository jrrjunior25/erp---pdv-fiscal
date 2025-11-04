-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "aliqCofins" DOUBLE PRECISION,
ADD COLUMN     "aliqIcms" DOUBLE PRECISION,
ADD COLUMN     "aliqPis" DOUBLE PRECISION,
ADD COLUMN     "cest" TEXT,
ADD COLUMN     "cfop" TEXT,
ADD COLUMN     "cstCofins" TEXT,
ADD COLUMN     "cstIcms" TEXT,
ADD COLUMN     "cstPis" TEXT,
ADD COLUMN     "ncm" TEXT,
ADD COLUMN     "origem" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'UN';

-- CreateIndex
CREATE INDEX "Product_ncm_idx" ON "Product"("ncm");
