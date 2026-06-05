import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findPublicActive() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        name: dto.name,
      },
    });

    if (existingProduct) {
      throw new BadRequestException('Product name already exists');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        isActive: true,
      },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.name) {
      const existingProduct = await this.prisma.product.findUnique({
        where: {
          name: dto.name,
        },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new BadRequestException('Product name already exists');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
