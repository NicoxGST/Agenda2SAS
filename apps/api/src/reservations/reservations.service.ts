import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus, Role } from '@prisma/client';

import { AvailabilityService } from '../availability/availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

type AuthUser = {
  id: number;
  role: Role;
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

  findAll() {
    return this.prisma.reservation.findMany({
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
      include: this.includeDetails,
      orderBy: {
        scheduledAt: 'asc',
      },
    });
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

  async updateStatus(authUser: AuthUser, id: number, status: ReservationStatus) {
    const reservation = await this.findOne(id);

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

  private async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
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
