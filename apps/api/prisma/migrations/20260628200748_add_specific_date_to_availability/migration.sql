-- AlterTable
ALTER TABLE "public"."WorkerAvailability" ADD COLUMN     "specificDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WorkerAvailability_workerId_specificDate_idx" ON "public"."WorkerAvailability"("workerId", "specificDate");
