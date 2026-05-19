import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {

  private readonly safeSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
    updatedAt: true,
  };

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

  findPublicById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },

      select:
        this.safeSelect,
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

    if (
      authUser.id ===
      targetUser.id
    ) {
      throw new ForbiddenException(
        'You cannot change your own role',
      );
    }

    if (
      authUser.role ===
      Role.ADMIN
    ) {

      if (
        targetUser.role ===
        Role.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'ADMIN cannot edit SUPER_ADMIN',
        );
      }

      if (
        role ===
        Role.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'ADMIN cannot assign SUPER_ADMIN',
        );
      }
    }

    if (
      targetUser.role ===
        Role.SUPER_ADMIN &&
      role !==
        Role.SUPER_ADMIN
    ) {

      const superAdmins =
        await this.prisma.user.count({
          where: {
            role:
              Role.SUPER_ADMIN,
          },
        });

      if (
        superAdmins <= 1
      ) {
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

      select:
        this.safeSelect,
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

  findAll() {
    return this.prisma.user.findMany({
      orderBy: {
        role: 'asc',
      },

      select:
        this.safeSelect,
    });
  }

  async remove(
    targetUserId: number,
  ) {

    const targetUser =
      await this.prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
      });

    if (!targetUser) {
      throw new BadRequestException(
        'User not found',
      );
    }

    if (
      targetUser.role ===
      Role.SUPER_ADMIN
    ) {

      const superAdmins =
        await this.prisma.user.count({
          where: {
            role:
              Role.SUPER_ADMIN,
          },
        });

      if (superAdmins <= 1) {
        throw new ForbiddenException(
          'At least one SUPER_ADMIN must exist',
        );
      }
    }

    return this.prisma.user.delete({
      where: {
        id: targetUserId,
      },

      select:
        this.safeSelect,
    });
  }

  async createByAdmin(data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) {

    const existingUser =
      await this.findByEmail(
        data.email,
      );

    if (existingUser) {
      throw new BadRequestException(
        'Email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        data.password,
        10,
      );

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password:
          hashedPassword,
        role: data.role,
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
}