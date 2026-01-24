-- AlterTable: Dodaj pole productName do CuringBatch
-- Dla istniejących rekordów ustawiamy domyślną wartość na podstawie reception.rawMaterial.name

-- Najpierw dodaj kolumnę jako nullable
ALTER TABLE "CuringBatch" ADD COLUMN "productName" TEXT;

-- Zaktualizuj istniejące rekordy - ustaw productName na podstawie powiązanego rawMaterial
UPDATE "CuringBatch" cb
SET "productName" = COALESCE(
    cb."meatDescription",
    (SELECT rm.name FROM "RawMaterialReception" r 
     JOIN "RawMaterial" rm ON r."rawMaterialId" = rm.id 
     WHERE r.id = cb."receptionId"),
    'Produkt peklowany'
);

-- Teraz ustaw kolumnę jako NOT NULL
ALTER TABLE "CuringBatch" ALTER COLUMN "productName" SET NOT NULL;
