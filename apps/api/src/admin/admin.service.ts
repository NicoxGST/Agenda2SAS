import { Injectable } from '@nestjs/common';
import { ReservationStatus, Role, WorkOrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      clients,
      workers,
      reservations,
      pendingReservations,
      workOrders,
      activeWorkOrders,
      readyWorkOrders,
      deliveredWorkOrders,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.CLIENT } }),
      this.prisma.user.count({ where: { role: Role.WORKER } }),
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: ReservationStatus.PENDING } }),
      this.prisma.workOrder.count(),
      this.prisma.workOrder.count({
        where: {
          status: {
            notIn: [WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED],
          },
        },
      }),
      this.prisma.workOrder.count({ where: { status: WorkOrderStatus.READY } }),
      this.prisma.workOrder.count({ where: { status: WorkOrderStatus.DELIVERED } }),
    ]);

    return {
      clients,
      workers,
      reservations,
      pendingReservations,
      workOrders,
      activeWorkOrders,
      readyWorkOrders,
      deliveredWorkOrders,
    };
  }
}
