-- AlterTable
ALTER TABLE "BatchMaterial" ADD COLUMN     "materialId" INTEGER,
ADD COLUMN     "materialReceiptId" INTEGER;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_materialReceiptId_fkey" FOREIGN KEY ("materialReceiptId") REFERENCES "MaterialReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
