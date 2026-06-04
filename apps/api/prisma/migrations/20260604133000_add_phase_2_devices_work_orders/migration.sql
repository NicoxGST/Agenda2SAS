-- CreateEnum
CREATE TYPE "public"."WorkOrderStatus" AS ENUM ('RECEIVED', 'DIAGNOSIS', 'WAITING_PARTS', 'IN_REPAIR', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Device" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT,
    "deviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DevicePhoto" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevicePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkOrder" (
    "id" SERIAL NOT NULL,
    "deviceId" INTEGER NOT NULL,
    "workerId" INTEGER NOT NULL,
    "reservationId" INTEGER,
    "problemDescription" TEXT NOT NULL,
    "diagnosis" TEXT,
    "laborCost" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."WorkOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Device_clientId_idx" ON "public"."Device"("clientId");

-- CreateIndex
CREATE INDEX "DevicePhoto_deviceId_idx" ON "public"."DevicePhoto"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_reservationId_key" ON "public"."WorkOrder"("reservationId");

-- CreateIndex
CREATE INDEX "WorkOrder_deviceId_idx" ON "public"."WorkOrder"("deviceId");

-- CreateIndex
CREATE INDEX "WorkOrder_workerId_idx" ON "public"."WorkOrder"("workerId");

-- AddForeignKey
ALTER TABLE "public"."Device" ADD CONSTRAINT "Device_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DevicePhoto" ADD CONSTRAINT "DevicePhoto_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "public"."Device"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrder" ADD CONSTRAINT "WorkOrder_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
