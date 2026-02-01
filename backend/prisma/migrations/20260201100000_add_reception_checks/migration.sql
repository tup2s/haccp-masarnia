-- AlterTable
ALTER TABLE "RawMaterialReception" ADD COLUMN "receivedTime" TEXT;
ALTER TABLE "RawMaterialReception" ADD COLUMN "vehicleClean" BOOLEAN DEFAULT true;
ALTER TABLE "RawMaterialReception" ADD COLUMN "vehicleTemperature" FLOAT;
ALTER TABLE "RawMaterialReception" ADD COLUMN "packagingIntact" BOOLEAN DEFAULT true;
ALTER TABLE "RawMaterialReception" ADD COLUMN "documentsComplete" BOOLEAN DEFAULT true;
