-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "nip" TEXT NOT NULL DEFAULT '',
    "vetNumber" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "ownerName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CCP" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hazardType" TEXT NOT NULL,
    "criticalLimit" TEXT NOT NULL,
    "monitoringMethod" TEXT NOT NULL,
    "monitoringFrequency" TEXT NOT NULL,
    "correctiveAction" TEXT NOT NULL,
    "verificationMethod" TEXT NOT NULL,
    "recordKeeping" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CCP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hazard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "preventiveMeasure" TEXT NOT NULL,
    "significance" TEXT NOT NULL,
    "processStep" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hazard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperaturePoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minTemp" DOUBLE PRECISION NOT NULL,
    "maxTemp" DOUBLE PRECISION NOT NULL,
    "ccpId" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemperaturePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureReading" (
    "id" SERIAL NOT NULL,
    "temperaturePointId" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "isCompliant" BOOLEAN NOT NULL,
    "notes" TEXT,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemperatureReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "vetNumber" TEXT,
    "contactPerson" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterial" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "supplierId" INTEGER,
    "storageConditions" TEXT,
    "shelfLife" INTEGER,
    "allergens" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RawMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawMaterialReception" (
    "id" SERIAL NOT NULL,
    "rawMaterialId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "temperature" DOUBLE PRECISION,
    "isCompliant" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "documentNumber" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawMaterialReception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuringBatch" (
    "id" SERIAL NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "receptionId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "curingMethod" TEXT NOT NULL,
    "curingSaltAmount" DOUBLE PRECISION,
    "brineWater" DOUBLE PRECISION,
    "brineSalt" DOUBLE PRECISION,
    "brineMaggi" DOUBLE PRECISION,
    "brineSugar" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plannedEndDate" TIMESTAMP(3) NOT NULL,
    "actualEndDate" TIMESTAMP(3),
    "temperature" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CuringBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "shelfLife" INTEGER NOT NULL,
    "storageTemp" TEXT NOT NULL,
    "allergens" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatch" (
    "id" SERIAL NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PRODUCTION',
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "finalTemperature" DOUBLE PRECISION,
    "temperatureCompliant" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchMaterial" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "rawMaterialId" INTEGER,
    "receptionId" INTEGER,
    "curingBatchId" INTEGER,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningArea" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "chemicals" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningRecord" (
    "id" SERIAL NOT NULL,
    "cleaningAreaId" INTEGER NOT NULL,
    "cleanedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL,
    "chemicals" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleaningRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PestControlPoint" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PestControlPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PestControlCheck" (
    "id" SERIAL NOT NULL,
    "pestControlPointId" INTEGER NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "findings" TEXT,
    "actionTaken" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PestControlCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingRecord" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "trainer" TEXT NOT NULL,
    "trainingDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingParticipant" (
    "id" SERIAL NOT NULL,
    "trainingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cause" TEXT,
    "actionTaken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "relatedCcpId" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditChecklist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" SERIAL NOT NULL,
    "checklistId" INTEGER NOT NULL,
    "auditDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auditor" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "findings" TEXT,
    "recommendations" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "uploadedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "supplierId" INTEGER,
    "minStock" DOUBLE PRECISION,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storageConditions" TEXT,
    "allergens" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialReceipt" (
    "id" SERIAL NOT NULL,
    "materialId" INTEGER NOT NULL,
    "supplierId" INTEGER,
    "batchNumber" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "pricePerUnit" DOUBLE PRECISION,
    "documentNumber" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Butchering" (
    "id" SERIAL NOT NULL,
    "receptionId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "butcheringDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Butchering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ButcheringElement" (
    "id" SERIAL NOT NULL,
    "butcheringId" INTEGER NOT NULL,
    "elementName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "destination" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ButcheringElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CuringBatch_batchNumber_key" ON "CuringBatch"("batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionBatch_batchNumber_key" ON "ProductionBatch"("batchNumber");

-- AddForeignKey
ALTER TABLE "TemperaturePoint" ADD CONSTRAINT "TemperaturePoint_ccpId_fkey" FOREIGN KEY ("ccpId") REFERENCES "CCP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureReading" ADD CONSTRAINT "TemperatureReading_temperaturePointId_fkey" FOREIGN KEY ("temperaturePointId") REFERENCES "TemperaturePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureReading" ADD CONSTRAINT "TemperatureReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterial" ADD CONSTRAINT "RawMaterial_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialReception" ADD CONSTRAINT "RawMaterialReception_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialReception" ADD CONSTRAINT "RawMaterialReception_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawMaterialReception" ADD CONSTRAINT "RawMaterialReception_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuringBatch" ADD CONSTRAINT "CuringBatch_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "RawMaterialReception"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuringBatch" ADD CONSTRAINT "CuringBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatch" ADD CONSTRAINT "ProductionBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatch" ADD CONSTRAINT "ProductionBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ProductionBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "RawMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_receptionId_fkey" FOREIGN KEY ("receptionId") REFERENCES "RawMaterialReception"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterial" ADD CONSTRAINT "BatchMaterial_curingBatchId_fkey" FOREIGN KEY ("curingBatchId") REFERENCES "CuringBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningRecord" ADD CONSTRAINT "CleaningRecord_cleaningAreaId_fkey" FOREIGN KEY ("cleaningAreaId") REFERENCES "CleaningArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningRecord" ADD CONSTRAINT "CleaningRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PestControlCheck" ADD CONSTRAINT "PestControlCheck_pestControlPointId_fkey" FOREIGN KEY ("pestControlPointId") REFERENCES "PestControlPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PestControlCheck" ADD CONSTRAINT "PestControlCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipant" ADD CONSTRAINT "TrainingParticipant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "TrainingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingParticipant" ADD CONSTRAINT "TrainingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "AuditChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditRecord" ADD CONSTRAINT "AuditRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReceipt" ADD CONSTRAINT "MaterialReceipt_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialReceipt" ADD CONSTRAINT "MaterialReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ButcheringElement" ADD CONSTRAINT "ButcheringElement_butcheringId_fkey" FOREIGN KEY ("butcheringId") REFERENCES "Butchering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

