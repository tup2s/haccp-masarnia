-- CreateTable - LabTestType (rodzaje badań laboratoryjnych)
CREATE TABLE "LabTestType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "normMin" DOUBLE PRECISION,
    "normMax" DOUBLE PRECISION,
    "normText" TEXT,
    "frequency" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestType_pkey" PRIMARY KEY ("id")
);

-- CreateTable - LabTest (wyniki badań)
CREATE TABLE "LabTest" (
    "id" SERIAL NOT NULL,
    "labTestTypeId" INTEGER NOT NULL,
    "sampleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultDate" TIMESTAMP(3),
    "sampleSource" TEXT,
    "sampleBatchId" TEXT,
    "result" TEXT,
    "resultValue" DOUBLE PRECISION,
    "isCompliant" BOOLEAN,
    "laboratory" TEXT,
    "documentNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable - WasteType (rodzaje odpadów)
CREATE TABLE "WasteType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteType_pkey" PRIMARY KEY ("id")
);

-- CreateTable - WasteCollector (firmy odbierające odpady)
CREATE TABLE "WasteCollector" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "vetNumber" TEXT,
    "contractNumber" TEXT,
    "contactPerson" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteCollector_pkey" PRIMARY KEY ("id")
);

-- CreateTable - WasteRecord (ewidencja odpadów)
CREATE TABLE "WasteRecord" (
    "id" SERIAL NOT NULL,
    "wasteTypeId" INTEGER NOT NULL,
    "collectorId" INTEGER,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentNumber" TEXT,
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WasteRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LabTest" ADD CONSTRAINT "LabTest_labTestTypeId_fkey" FOREIGN KEY ("labTestTypeId") REFERENCES "LabTestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "WasteType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WasteRecord" ADD CONSTRAINT "WasteRecord_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "WasteCollector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
