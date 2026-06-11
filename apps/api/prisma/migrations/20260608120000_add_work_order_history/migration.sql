-- CreateTable
CREATE TABLE "WorkOrderHistory" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "previousStatus" "WorkOrderStatus" NOT NULL,
    "newStatus" "WorkOrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedByUserId" INTEGER NOT NULL,

    CONSTRAINT "WorkOrderHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderHistory_changedByUserId_idx" ON "WorkOrderHistory"("changedByUserId");

-- CreateIndex
CREATE INDEX "WorkOrderHistory_workOrderId_createdAt_idx" ON "WorkOrderHistory"("workOrderId", "createdAt");

-- AddForeignKey
ALTER TABLE "WorkOrderHistory" ADD CONSTRAINT "WorkOrderHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderHistory" ADD CONSTRAINT "WorkOrderHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
