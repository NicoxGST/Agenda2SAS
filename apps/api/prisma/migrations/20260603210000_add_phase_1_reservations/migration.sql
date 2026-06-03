-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ATTENDED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "public"."WorkerAvailability" (
    "id" SERIAL NOT NULL,
    "workerId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "workerId" INTEGER NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "clientNotes" TEXT,
    "contactPhone" TEXT NOT NULL,
    "depositAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkerAvailability_workerId_dayOfWeek_idx" ON "public"."WorkerAvailability"("workerId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_workerId_scheduledAt_key" ON "public"."Reservation"("workerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Reservation_clientId_scheduledAt_idx" ON "public"."Reservation"("clientId", "scheduledAt");

-- AddForeignKey
ALTER TABLE "public"."WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
