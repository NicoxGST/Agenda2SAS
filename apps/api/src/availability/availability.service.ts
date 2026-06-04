import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerAvailabilityDto } from './dto/create-worker-availability.dto';
import { UpdateWorkerAvailabilityDto } from './dto/update-worker-availability.dto';

type AuthUser = {
  id: number;
  role: Role;
};

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  private publicWorkerSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
  };

  findWorkers() {
    return this.prisma.user.findMany({
      where: {
        role: Role.WORKER,
      },
      orderBy: {
        name: 'asc',
      },
      select: this.publicWorkerSelect,
    });
  }

  findAll(authUser: AuthUser, workerId?: number) {
    const scopedWorkerId = authUser.role === Role.WORKER ? authUser.id : workerId;

    return this.prisma.workerAvailability.findMany({
      where: scopedWorkerId ? { workerId: scopedWorkerId } : undefined,
      include: {
        worker: {
          select: this.publicWorkerSelect,
        },
      },
      orderBy: [
        {
          dayOfWeek: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
    });
  }

  findMine(workerId: number) {
    return this.prisma.workerAvailability.findMany({
      where: {
        workerId,
      },
      include: {
        worker: {
          select: this.publicWorkerSelect,
        },
      },
      orderBy: [
        {
          dayOfWeek: 'asc',
        },
        {
          startTime: 'asc',
        },
      ],
    });
  }

  async create(authUser: AuthUser, dto: CreateWorkerAvailabilityDto) {
    this.ensureCanManageWorker(authUser, dto.workerId);

    await this.ensureWorkerExists(dto.workerId);
    this.ensureValidTimeRange(dto.startTime, dto.endTime);

    return this.prisma.workerAvailability.create({
      data: {
        workerId: dto.workerId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotMinutes: dto.slotMinutes ?? 60,
        isActive: dto.isActive ?? true,
      },
      include: {
        worker: {
          select: this.publicWorkerSelect,
        },
      },
    });
  }

  async update(authUser: AuthUser, id: number, dto: UpdateWorkerAvailabilityDto) {
    const availability = await this.findOne(id);
    const workerId = dto.workerId ?? availability.workerId;

    this.ensureCanManageWorker(authUser, availability.workerId);
    this.ensureCanManageWorker(authUser, workerId);

    if (dto.workerId) {
      await this.ensureWorkerExists(dto.workerId);
    }

    const startTime = dto.startTime ?? availability.startTime;
    const endTime = dto.endTime ?? availability.endTime;
    this.ensureValidTimeRange(startTime, endTime);

    return this.prisma.workerAvailability.update({
      where: {
        id,
      },
      data: dto,
      include: {
        worker: {
          select: this.publicWorkerSelect,
        },
      },
    });
  }

  async remove(authUser: AuthUser, id: number) {
    const availability = await this.findOne(id);

    this.ensureCanManageWorker(authUser, availability.workerId);

    return this.prisma.workerAvailability.delete({
      where: {
        id,
      },
    });
  }

  async getAvailableSlots(workerId: number, date: string) {
    await this.ensureWorkerExists(workerId);

    const dayOfWeek = this.getDayOfWeek(date);
    const availabilities = await this.prisma.workerAvailability.findMany({
      where: {
        workerId,
        dayOfWeek,
        isActive: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);
    const reservations = await this.prisma.reservation.findMany({
      where: {
        workerId,
        scheduledAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.ATTENDED,
          ],
        },
      },
      select: {
        scheduledAt: true,
      },
    });

    const reservedTimes = new Set(
      reservations.map((reservation) => this.formatTime(reservation.scheduledAt)),
    );

    return availabilities.flatMap((availability) => {
      return this.buildSlots(
        date,
        availability.startTime,
        availability.endTime,
        availability.slotMinutes,
        reservedTimes,
      );
    });
  }

  async isSlotAvailable(workerId: number, scheduledAt: Date) {
    const date = scheduledAt.toISOString().slice(0, 10);
    const time = this.formatTime(scheduledAt);
    const slots = await this.getAvailableSlots(workerId, date);

    return slots.some((slot) => slot.time === time);
  }

  private async findOne(id: number) {
    const availability = await this.prisma.workerAvailability.findUnique({
      where: {
        id,
      },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    return availability;
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

  private ensureCanManageWorker(authUser: AuthUser, workerId: number) {
    if (authUser.role === Role.WORKER && authUser.id !== workerId) {
      throw new ForbiddenException('Workers can only manage their own availability');
    }
  }

  private ensureValidTimeRange(startTime: string, endTime: string) {
    if (this.toMinutes(startTime) >= this.toMinutes(endTime)) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private buildSlots(
    date: string,
    startTime: string,
    endTime: string,
    slotMinutes: number,
    reservedTimes: Set<string>,
  ) {
    const slots: {
      time: string;
      scheduledAt: string;
    }[] = [];
    let cursor = this.toMinutes(startTime);
    const end = this.toMinutes(endTime);

    while (cursor + slotMinutes <= end) {
      const time = this.fromMinutes(cursor);

      if (!reservedTimes.has(time)) {
        slots.push({
          time,
          scheduledAt: `${date}T${time}:00.000Z`,
        });
      }

      cursor += slotMinutes;
    }

    return slots;
  }

  private getDayOfWeek(date: string) {
    return new Date(`${date}T00:00:00.000Z`).getUTCDay();
  }

  private formatTime(date: Date) {
    return date.toISOString().slice(11, 16);
  }

  private toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);

    return hours * 60 + minutes;
  }

  private fromMinutes(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
