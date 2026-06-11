import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, WorkOrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';

type AuthUser = {
  id: number;
  role: Role;
};

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  private includeDetails = {
    device: {
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
    worker: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    },
    reservation: true,
  };

  findAll(authUser: AuthUser) {
    return this.prisma.workOrder.findMany({
      where: this.getScopedWhere(authUser),
      include: this.includeDetails,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(authUser: AuthUser, id: number) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: {
        id,
      },
      include: this.includeDetails,
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    this.ensureCanAccessWorkOrder(authUser, workOrder);

    return workOrder;
  }

  async create(authUser: AuthUser, dto: CreateWorkOrderDto) {
    this.ensureCanManageWorkOrders(authUser);

    const workerId = authUser.role === Role.WORKER ? authUser.id : dto.workerId;

    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    const device = await this.ensureDeviceExists(dto.deviceId);
    await this.ensureWorkerExists(workerId);

    if (dto.reservationId) {
      await this.ensureReservationCanBeLinked(
        authUser,
        dto.reservationId,
        dto.deviceId,
        device.clientId,
        workerId,
      );
    }

    return this.prisma.workOrder.create({
      data: {
        deviceId: dto.deviceId,
        workerId,
        reservationId: dto.reservationId,
        problemDescription: dto.problemDescription,
        diagnosis: dto.diagnosis,
        laborCost: dto.laborCost ?? 0,
        status: WorkOrderStatus.RECEIVED,
      },
      include: this.includeDetails,
    });
  }

  async update(authUser: AuthUser, id: number, dto: UpdateWorkOrderDto) {
    this.ensureCanManageWorkOrders(authUser);

    const workOrder = await this.findOne(authUser, id);
    const workerId =
      authUser.role === Role.WORKER ? authUser.id : dto.workerId ?? workOrder.workerId;
    const deviceId = dto.deviceId ?? workOrder.deviceId;
    const device = await this.ensureDeviceExists(deviceId);

    if (dto.workerId) {
      await this.ensureWorkerExists(workerId);
    }

    if (dto.reservationId) {
      await this.ensureReservationCanBeLinked(
        authUser,
        dto.reservationId,
        deviceId,
        device.clientId,
        workerId,
        id,
      );
    }

    return this.prisma.workOrder.update({
      where: {
        id,
      },
      data: {
        deviceId,
        workerId,
        reservationId: dto.reservationId,
        problemDescription: dto.problemDescription,
        diagnosis: dto.diagnosis,
        laborCost: dto.laborCost,
      },
      include: this.includeDetails,
    });
  }

  async updateStatus(authUser: AuthUser, id: number, status: WorkOrderStatus) {
    this.ensureCanManageWorkOrders(authUser);

    await this.findOne(authUser, id);

    return this.prisma.workOrder.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: this.includeDetails,
    });
  }

  private getScopedWhere(authUser: AuthUser) {
    if (authUser.role === Role.CLIENT) {
      return {
        device: {
          clientId: authUser.id,
        },
      };
    }

    if (authUser.role === Role.WORKER) {
      return {
        workerId: authUser.id,
      };
    }

    return undefined;
  }

  private ensureCanAccessWorkOrder(authUser: AuthUser, workOrder: any) {
    if (authUser.role === Role.CLIENT && workOrder.device.clientId !== authUser.id) {
      throw new ForbiddenException('Clients can only access their own work orders');
    }

    if (authUser.role === Role.WORKER && workOrder.workerId !== authUser.id) {
      throw new ForbiddenException('Workers can only access assigned work orders');
    }
  }

  private ensureCanManageWorkOrders(authUser: AuthUser) {
    if (authUser.role === Role.CLIENT) {
      throw new ForbiddenException('Clients cannot manage work orders');
    }
  }

  private async ensureDeviceExists(deviceId: number) {
    const device = await this.prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

    if (!device) {
      throw new BadRequestException('Device not found');
    }

    return device;
  }

  private async ensureWorkerExists(workerId: number) {
    const worker = await this.prisma.user.findFirst({
      where: {
        id: workerId,
        role: Role.WORKER,
      },
    });

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }
  }

  private async ensureReservationCanBeLinked(
    authUser: AuthUser,
    reservationId: number,
    deviceId: number,
    clientId: number,
    workerId: number,
    currentWorkOrderId?: number,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },
      include: {
        workOrders: true,
      },
    });

    if (!reservation) {
      throw new BadRequestException('Reservation not found');
    }

    if (reservation.clientId !== clientId) {
      throw new BadRequestException('Reservation client must match device owner');
    }

    if (authUser.role === Role.WORKER && reservation.workerId !== authUser.id) {
      throw new ForbiddenException('Workers can only use their own reservations');
    }

    if (reservation.workerId !== workerId) {
      throw new BadRequestException('Reservation worker must match work order worker');
    }

    const conflict = reservation.workOrders.find(
      (wo) => wo.deviceId === deviceId && wo.id !== currentWorkOrderId,
    );

    if (conflict) {
      throw new BadRequestException(
        'A work order for this device already exists in this reservation',
      );
    }
  }
}
