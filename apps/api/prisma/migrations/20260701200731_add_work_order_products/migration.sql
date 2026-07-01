-- CreateTable
CREATE TABLE "public"."WorkOrderProduct" (
    "id" SERIAL NOT NULL,
    "workOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkOrderProduct_workOrderId_idx" ON "public"."WorkOrderProduct"("workOrderId");

-- AddForeignKey
ALTER TABLE "public"."WorkOrderProduct" ADD CONSTRAINT "WorkOrderProduct_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "public"."WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkOrderProduct" ADD CONSTRAINT "WorkOrderProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
