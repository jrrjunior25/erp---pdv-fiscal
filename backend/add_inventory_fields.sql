-- Add inventory fields to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "maxStock" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastStockIn" TIMESTAMP;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastStockOut" TIMESTAMP;

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_supplierId_fkey'
  ) THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" 
      FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL;
  END IF;
END $$;
