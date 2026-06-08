import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateDevicePhotoDto } from './dto/create-device-photo.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

type AuthUser = {
  id: number;
  role: Role;
};

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  private clientSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
  };

  private deviceInclude = {
    client: {
      select: this.clientSelect,
    },
    photos: true,
    workOrders: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
  };

  private detailInclude = {
    client: {
      select: this.clientSelect,
    },
    photos: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    workOrders: {
      orderBy: {
        createdAt: 'desc' as const,
      },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        reservation: {
          include: {
            worker: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            service: true,
          },
        },
      },
    },
  };

  findMy(clientId: number) {
    return this.prisma.device.findMany({
      where: {
        clientId,
      },
      include: this.deviceInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAll(clientId?: number) {
    return this.prisma.device.findMany({
      where: clientId ? { clientId } : undefined,
      include: this.deviceInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findClients(search?: string) {
    return this.prisma.user.findMany({
      where: {
        role: Role.CLIENT,
        ...(search
          ? {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: {
        name: 'asc',
      },
      select: this.clientSelect,
      take: 20,
    });
  }

  async findOne(authUser: AuthUser, id: number) {
    const device = await this.prisma.device.findUnique({
      where: {
        id,
      },
      include: this.deviceInclude,
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    this.ensureCanAccessDevice(authUser, device.clientId);

    return device;
  }

  async findDetails(authUser: AuthUser, id: number) {
    const device = await this.prisma.device.findUnique({
      where: {
        id,
      },
      include: this.detailInclude,
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    this.ensureCanAccessDevice(authUser, device.clientId);

    const reservations = device.workOrders
      .map((workOrder) => workOrder.reservation)
      .filter((reservation) => reservation !== null);

    const clientPhone = reservations[0]?.contactPhone ?? null;
    const workOrders = device.workOrders.map(({ reservation, ...workOrder }) => ({
      ...workOrder,
      reservationId: reservation?.id ?? workOrder.reservationId,
    }));

    return {
      ...device,
      client: {
        ...device.client,
        phone: clientPhone,
      },
      reservations,
      workOrders,
    };
  }

  async create(authUser: AuthUser, dto: CreateDeviceDto) {
    const clientId = authUser.role === Role.CLIENT ? authUser.id : dto.clientId;

    if (!clientId) {
      throw new BadRequestException('clientId is required');
    }

    await this.ensureClientExists(clientId);

    return this.prisma.device.create({
      data: {
        clientId,
        brand: dto.brand,
        model: dto.model,
        serialNumber: dto.serialNumber,
        deviceType: dto.deviceType,
        description: dto.description,
      },
      include: this.deviceInclude,
    });
  }

  async update(authUser: AuthUser, id: number, dto: UpdateDeviceDto) {
    const device = await this.prisma.device.findUnique({
      where: {
        id,
      },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    this.ensureCanEditDevice(authUser, device.clientId);

    if (authUser.role === Role.CLIENT && dto.clientId && dto.clientId !== authUser.id) {
      throw new ForbiddenException('Clients cannot reassign devices');
    }

    if (dto.clientId) {
      await this.ensureClientExists(dto.clientId);
    }

    return this.prisma.device.update({
      where: {
        id,
      },
      data: dto,
      include: this.deviceInclude,
    });
  }

  async findPhotos(authUser: AuthUser, deviceId: number) {
    await this.findOne(authUser, deviceId);

    return this.prisma.devicePhoto.findMany({
      where: {
        deviceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createPhoto(authUser: AuthUser, deviceId: number, dto: CreateDevicePhotoDto) {
    await this.findOne(authUser, deviceId);

    return this.prisma.devicePhoto.create({
      data: {
        deviceId,
        url: dto.url,
        description: dto.description,
      },
    });
  }

  async removePhoto(authUser: AuthUser, photoId: number) {
    const photo = await this.prisma.devicePhoto.findUnique({
      where: {
        id: photoId,
      },
      include: {
        device: true,
      },
    });

    if (!photo) {
      throw new NotFoundException('Device photo not found');
    }

    this.ensureCanEditDevice(authUser, photo.device.clientId);

    return this.prisma.devicePhoto.delete({
      where: {
        id: photoId,
      },
    });
  }

  private async ensureClientExists(clientId: number) {
    const client = await this.prisma.user.findFirst({
      where: {
        id: clientId,
        role: Role.CLIENT,
      },
    });

    if (!client) {
      throw new BadRequestException('Client not found');
    }
  }

  private ensureCanAccessDevice(authUser: AuthUser, clientId: number) {
    if (authUser.role === Role.CLIENT && authUser.id !== clientId) {
      throw new ForbiddenException('Clients can only access their own devices');
    }
  }

  private ensureCanEditDevice(authUser: AuthUser, clientId: number) {
    if (authUser.role === Role.CLIENT && authUser.id !== clientId) {
      throw new ForbiddenException('Clients can only edit their own devices');
    }
  }
}
