import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) {
    return this.prisma.user.create({
      data,
    });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateRole(
    authUser: any,
    targetUserId: number,
    role: Role,
  ) {

    const targetUser =
      await this.findById(
        targetUserId,
      );

    if (!targetUser) {
      throw new BadRequestException(
        'User not found',
      );
    }

    if (authUser.id === targetUser.id) {
      throw new ForbiddenException(
        'You cannot change your own role',
      );
    }

    if (
      targetUser.role === Role.SUPER_ADMIN &&
      role !== Role.SUPER_ADMIN
    ) {

      const superAdmins =
        await this.prisma.user.count({
          where: {
            role: Role.SUPER_ADMIN,
          },
        });

      if (superAdmins <= 1) {
        throw new ForbiddenException(
          'At least one SUPER_ADMIN must exist',
        );
      }
    }

    return this.prisma.user.update({
      where: {
        id: targetUserId,
      },

      data: {
        role,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        refreshToken,
      },
    });
  }
}