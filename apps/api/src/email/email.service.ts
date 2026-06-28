import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: config.getOrThrow('SMTP_USER'),
        pass: config.getOrThrow('SMTP_PASS'),
      },
    });
  }

  async sendResetCode(to: string, name: string, code: string) {
    await this.transporter.sendMail({
      from: `"Agenda SAS" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: 'Recuperar contraseña — Agenda SAS',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #1a2035;">Hola ${name},</h2>
          <p style="color: #555;">Recibimos una solicitud para restablecer tu contraseña. Tu código es:</p>
          <div style="font-size: 40px; font-weight: bold; letter-spacing: 10px; margin: 24px 0; color: #e06c00; text-align: center;">
            ${code}
          </div>
          <p style="color: #555;">Este código expira en <strong>15 minutos</strong>.</p>
          <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `,
    });
  }

  async sendVerificationCode(to: string, name: string, code: string) {
    await this.transporter.sendMail({
      from: `"Agenda SAS" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: 'Código de verificación — Agenda SAS',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #1a2035;">Hola ${name},</h2>
          <p style="color: #555;">Tu código de verificación es:</p>
          <div style="font-size: 40px; font-weight: bold; letter-spacing: 10px; margin: 24px 0; color: #e06c00; text-align: center;">
            ${code}
          </div>
          <p style="color: #555;">Este código expira en <strong>15 minutos</strong>.</p>
          <p style="color: #999; font-size: 12px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        </div>
      `,
    });
  }
}