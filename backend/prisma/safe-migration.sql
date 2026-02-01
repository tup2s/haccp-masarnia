-- Bezpieczna migracja - dodanie nowych kolumn
-- Nie usuwa żadnych danych!

-- Dodaj kolumnę requiredTemperature do Product (opcjonalna temperatura wymagana)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "requiredTemperature" DOUBLE PRECISION;

-- Dodaj kolumny do BatchMaterial dla powiązania z materiałami
ALTER TABLE "BatchMaterial" ADD COLUMN IF NOT EXISTS "materialId" INTEGER;
ALTER TABLE "BatchMaterial" ADD COLUMN IF NOT EXISTS "materialReceiptId" INTEGER;

-- Dodaj klucze obce (foreign keys)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'BatchMaterial_materialId_fkey'
    ) THEN
        ALTER TABLE "BatchMaterial" 
        ADD CONSTRAINT "BatchMaterial_materialId_fkey" 
        FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'BatchMaterial_materialReceiptId_fkey'
    ) THEN
        ALTER TABLE "BatchMaterial" 
        ADD CONSTRAINT "BatchMaterial_materialReceiptId_fkey" 
        FOREIGN KEY ("materialReceiptId") REFERENCES "MaterialReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Gotowe!
