import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus, Role, WorkOrderStatus } from '@prisma/client';

import { AvailabilityService } from '../availability/availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttendReservationDto } from './dto/attend-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

type AuthUser = {
  id: number;
  role: Role;
};

type ReservationsQuery = {
  status?: string;
  workerId?: string;
  date?: string;
};

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private availabilityService: AvailabilityService,
  ) {}

  private includeDetails = {
    client: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    worker: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    service: true,
  };

  findAll(query: ReservationsQuery = {}) {
    const where: any = {};

    if (query.status) where.status = query.status as ReservationStatus;
    if (query.workerId) where.workerId = Number(query.workerId);
    if (query.date) {
      const dateStart = new Date(query.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(query.date);
      dateEnd.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: dateStart, lte: dateEnd };
    }

    return this.prisma.reservation.findMany({
      where,
      include: this.includeDetails,
      orderBy: {
        scheduledAt: 'desc',
      },
    });
  }

  findByClient(clientId: number) {
    return this.prisma.reservation.findMany({
      where: {
        clientId,
      },
      include: this.includeDetails,
      orderBy: {
        scheduledAt: 'desc',
      },
    });
  }

  findByWorker(workerId: number) {
    return this.prisma.reservation.findMany({
      where: {
        workerId,
      },
      include: {
        ...this.includeDetails,
        workOrders: {
          include: {
            device: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: this.includeDetails,
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  async create(authUser: AuthUser, dto: CreateReservationDto) {
    const scheduledAt = new Date(dto.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt');
    }

    await this.ensureServiceIsActive(dto.serviceId);
    await this.ensureWorkerExists(dto.workerId);

    const available = await this.availabilityService.isSlotAvailable(
      dto.workerId,
      scheduledAt,
    );

    if (!available) {
      throw new BadRequestException('Selected slot is not available');
    }

    try {
      return await this.prisma.reservation.create({
        data: {
          clientId: authUser.id,
          workerId: dto.workerId,
          serviceId: dto.serviceId,
          scheduledAt,
          contactPhone: dto.contactPhone,
          clientNotes: dto.clientNotes,
          depositAmount: dto.depositAmount ?? 0,
          status: ReservationStatus.PENDING,
        },
        include: this.includeDetails,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Selected slot is already reserved');
      }

      throw error;
    }
  }

  async update(authUser: AuthUser, id: number, dto: UpdateReservationDto) {
    const reservation = await this.findOne(id);

    if (authUser.role === Role.WORKER && reservation.workerId !== authUser.id) {
      throw new ForbiddenException('Workers can only update their own reservations');
    }

    const data: any = {};
    if (dto.workerId !== undefined) data.workerId = dto.workerId;
    if (dto.serviceId !== undefined) data.serviceId = dto.serviceId;
    if (dto.scheduledAt !== undefined) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.clientNotes !== undefined) data.clientNotes = dto.clientNotes;
    if (dto.depositAmount !== undefined) data.depositAmount = dto.depositAmount;

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data,
        include: this.includeDetails,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Selected slot is already reserved');
      }
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.reservation.delete({
      where: { id },
      select: { id: true },
    });
  }

  async updateStatus(authUser: AuthUser, id: number, status: ReservationStatus) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (authUser.role === Role.WORKER && reservation.workerId !== authUser.id) {
      throw new ForbiddenException('Workers can only update their own reservations');
    }

    return this.prisma.reservation.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: this.includeDetails,
    });
  }

  async attend(authUser: AuthUser, id: number, dto: AttendReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    if (authUser.role === Role.WORKER && reservation.workerId !== authUser.id) {
      throw new ForbiddenException('Workers can only attend their own reservations');
    }

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException('Only PENDING or CONFIRMED reservations can be attended');
    }

    if (!dto.deviceId && (!dto.brand || !dto.model || !dto.deviceType)) {
      throw new BadRequestException(
        'Device information (brand, model, deviceType) is required when deviceId is not provided',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let deviceId = dto.deviceId;

      if (!deviceId) {
        const device = await tx.device.create({
          data: {
            clientId: reservation.clientId,
            brand: dto.brand!,
            model: dto.model!,
            serialNumber: dto.serialNumber,
            deviceType: dto.deviceType!,
            description: dto.deviceDescription ?? '',
          },
        });
        deviceId = device.id;
      }

      await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.ATTENDED },
      });

      return tx.workOrder.create({
        data: {
          deviceId,
          workerId: reservation.workerId,
          reservationId: id,
          problemDescription: dto.problemDescription,
          laborCost: dto.laborCost ?? 0,
          status: WorkOrderStatus.RECEIVED,
        },
        include: {
          device: {
            include: {
              client: { select: { id: true, name: true, email: true } },
            },
          },
          worker: { select: { id: true, name: true, email: true, role: true } },
          reservation: true,
        },
      });
    });
  }

  private async ensureServiceIsActive(serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        isActive: true,
      },
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }
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
}
