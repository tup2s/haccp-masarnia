/*
  Warnings:

  - You are about to drop the column `deliveryDate` on the `RawMaterialReception` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryTime` on the `RawMaterialReception` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RawMaterialReception" DROP COLUMN "deliveryDate",
DROP COLUMN "deliveryTime";

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);
