import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService:
      UsersService,

    private jwtService:
      JwtService,

    private configService:
      ConfigService,

    private emailService:
      EmailService,

    private prisma:
      PrismaService,
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

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Email not verified. Please check your inbox.',
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

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeAt: new Date(),
      },
    });

    await this.emailService.sendVerificationCode(user.email, user.name, code);

    return {
      message: 'User created. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.verificationCode || !user.verificationCodeAt) {
      throw new BadRequestException('Solicitud de verificación inválida');
    }

    if (user.isVerified) {
      throw new BadRequestException('El correo ya fue verificado');
    }

    const diffMinutes =
      (Date.now() - user.verificationCodeAt.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    if (user.verificationCode !== dto.code) {
      throw new UnauthorizedException('Código incorrecto');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeAt: null,
      },
    });

    return { message: 'Correo verificado exitosamente' };
  }

  async resendCode(dto: ResendCodeDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (user.isVerified) {
      throw new BadRequestException('El correo ya fue verificado');
    }

    if (user.verificationCodeAt) {
      const diffSeconds =
        (Date.now() - user.verificationCodeAt.getTime()) / 1000;

      if (diffSeconds < 60) {
        throw new BadRequestException(
          `Debes esperar ${Math.ceil(60 - diffSeconds)} segundos antes de solicitar un nuevo código`,
        );
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeAt: new Date(),
      },
    });

    await this.emailService.sendVerificationCode(user.email, user.name, code);

    return { message: 'Código enviado' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.isVerified) {
      return { message: 'Si el correo existe, recibirás un código' };
    }

    if (user.resetTokenAt) {
      const diffSeconds = (Date.now() - user.resetTokenAt.getTime()) / 1000;
      if (diffSeconds < 60) {
        throw new BadRequestException(
          `Debes esperar ${Math.ceil(60 - diffSeconds)} segundos antes de solicitar un nuevo código`,
        );
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: code,
        resetTokenAt: new Date(),
      },
    });

    await this.emailService.sendResetCode(user.email, user.name, code);

    return { message: 'Si el correo existe, recibirás un código' };
  }

  async verifyResetCode(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.resetToken || !user.resetTokenAt) {
      throw new BadRequestException('Solicitud inválida');
    }

    const diffMinutes = (Date.now() - user.resetTokenAt.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    if (user.resetToken !== code) {
      throw new BadRequestException('Código incorrecto');
    }

    return { message: 'Código válido' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.resetToken || !user.resetTokenAt) {
      throw new BadRequestException('Solicitud inválida');
    }

    const diffMinutes = (Date.now() - user.resetTokenAt.getTime()) / 1000 / 60;

    if (diffMinutes > 15) {
      throw new BadRequestException('El código ha expirado. Solicita uno nuevo.');
    }

    if (user.resetToken !== dto.code) {
      throw new BadRequestException('Código incorrecto');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenAt: null,
      },
    });

    return { message: 'Contraseña actualizada exitosamente' };
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