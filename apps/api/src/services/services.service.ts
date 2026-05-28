import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.service.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async create(dto: CreateServiceDto) {
    const existingService = await this.prisma.service.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (existingService) {
      throw new BadRequestException('Service name already exists');
    }

    return this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        isActive: true,
      },
    });
  }

  async update(id: number, dto: UpdateServiceDto) {
    await this.findOne(id);

    if (dto.name) {
      const existingService = await this.prisma.service.findUnique({
        where: {
          name: dto.name,
        },
      });

      if (existingService && existingService.id !== id) {
        throw new BadRequestException('Service name already exists');
      }
    }

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
