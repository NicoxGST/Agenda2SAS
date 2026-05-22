import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {Role,} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService:
      UsersService,

    private jwtService:
      JwtService,

    private configService:
      ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(loginDto: LoginDto) {

    const user =
      await this.usersService.findByEmail(
        loginDto.email,
      );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const passwordMatch =
      await bcrypt.compare(
        loginDto.password,
        user.password,
      );

    if (!passwordMatch) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const tokens =
      await this.generateTokens(
        user,
      );

    const hashedRefresh =
      await bcrypt.hash(
        tokens.refreshToken,
        10,
      );

    await this.usersService.updateRefreshToken(
      user.id,
      hashedRefresh,
    );

    return tokens;
  }

  async register(
    registerDto: RegisterDto,
  ) {

    const existingUser =
      await this.usersService.findByEmail(
        registerDto.email,
      );

    if (existingUser) {
      throw new ConflictException(
        'Email already exists',
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        registerDto.password,
        10,
      );

    const user =
      await this.usersService.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        role: Role.CLIENT,
      });

    return {
      message: 'User created',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async generateTokens(
    user: any,
  ) {

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken =
      this.jwtService.sign(
        payload,
        {
          secret:
            this.configService.getOrThrow<string>(
              'JWT_SECRET',
            ),

          expiresIn:
            this.configService.getOrThrow<any>(
              'JWT_EXPIRES_IN',
            ),
        },
      );

    const refreshToken =
      this.jwtService.sign(
        payload,
        {
          secret:
            this.configService.getOrThrow<string>(
              'JWT_REFRESH_SECRET',
            ),

          expiresIn:
            this.configService.getOrThrow<any>(
              'JWT_REFRESH_EXPIRES_IN',
            ),
        },
      );

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(
    refreshToken: string,
  ) {

    const payload =
      this.jwtService.verify(
        refreshToken,
        {
          secret:
            this.configService.getOrThrow<string>(
              'JWT_REFRESH_SECRET',
            ),
        },
      );
    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (
      !user ||
      !user.refreshToken
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const isMatch =
      await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

    if (!isMatch) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const tokens =
      await this.generateTokens(
        user,
      );

    const hashedRefresh =
      await bcrypt.hash(
        tokens.refreshToken,
        10,
      );

    await this.usersService.updateRefreshToken(
      user.id,
      hashedRefresh,
    );

    return tokens;
  }

  async logout(
    userId: number,
  ) {

    await this.usersService.updateRefreshToken(
      userId,
      null,
    );

    return {
      message:
        'Logged out successfully',
    };
  }

  async me(userId: number) {
    return this.usersService.findPublicById(
      userId,
    );
  }

}