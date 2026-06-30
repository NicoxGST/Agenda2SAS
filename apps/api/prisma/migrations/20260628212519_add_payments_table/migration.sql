-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" SERIAL NOT NULL,
    "mpPreferenceId" TEXT NOT NULL,
    "mpPaymentId" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "reservationData" JSONB NOT NULL,
    "reservationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpPreferenceId_key" ON "public"."Payment"("mpPreferenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mpPaymentId_key" ON "public"."Payment"("mpPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "public"."Payment"("reservationId");

-- CreateIndex
CREATE INDEX "Payment_clientId_idx" ON "public"."Payment"("clientId");

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
