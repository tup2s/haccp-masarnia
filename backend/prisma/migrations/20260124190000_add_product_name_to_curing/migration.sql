-- AlterTable: Dodaj pole productName do CuringBatch (opcjonalne)
ALTER TABLE "CuringBatch" ADD COLUMN IF NOT EXISTS "productName" TEXT;
