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

  async sendReservationConfirmation(
    to: string,
    name: string,
    details: {
      reservationId: number;
      serviceName: string;
      workerName: string;
      scheduledAt: Date;
      depositAmount: number;
    },
  ) {
    const fecha = details.scheduledAt.toLocaleDateString('es-CL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const hora = details.scheduledAt.toLocaleTimeString('es-CL', {
      hour: '2-digit', minute: '2-digit',
    });

    await this.transporter.sendMail({
      from: `"LinaresTech" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: `Reserva confirmada #${details.reservationId} — LinaresTech`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #1a2035;">¡Reserva confirmada!</h2>
          <p style="color: #555;">Hola <strong>${name}</strong>, tu reserva ha sido registrada exitosamente.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr><td style="padding: 8px 0; color: #999;">N° de reserva</td><td style="padding: 8px 0; font-weight: bold;">#${details.reservationId}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Servicio</td><td style="padding: 8px 0;">${details.serviceName}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Técnico</td><td style="padding: 8px 0;">${details.workerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Fecha</td><td style="padding: 8px 0;">${fecha}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Hora</td><td style="padding: 8px 0;">${hora}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Abono pagado</td><td style="padding: 8px 0; color: #16a34a; font-weight: bold;">$${details.depositAmount.toLocaleString('es-CL')} CLP</td></tr>
          </table>
          <p style="color: #555;">Te esperamos en nuestra tienda a la hora indicada.</p>
          <p style="color: #999; font-size: 12px;">Si tienes dudas, responde este correo.</p>
        </div>
      `,
    });
  }

  async sendEquipmentReady(
    to: string,
    name: string,
    details: {
      workOrderId: number;
      deviceBrand: string;
      deviceModel: string;
    },
  ) {
    await this.transporter.sendMail({
      from: `"LinaresTech" <${this.config.get('SMTP_USER')}>`,
      to,
      subject: `Tu equipo está listo para retirar — LinaresTech`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #1a2035;">¡Tu equipo está listo! 🎉</h2>
          <p style="color: #555;">Hola <strong>${name}</strong>, te informamos que tu equipo ya está reparado y disponible para retiro.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <tr><td style="padding: 8px 0; color: #999;">Orden de trabajo</td><td style="padding: 8px 0; font-weight: bold;">#${details.workOrderId}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Equipo</td><td style="padding: 8px 0;">${details.deviceBrand} ${details.deviceModel}</td></tr>
          </table>
          <p style="color: #555;">Puedes pasar a retirarlo en horario de atención. ¡Gracias por confiar en nosotros!</p>
          <p style="color: #999; font-size: 12px;">Si tienes dudas, responde este correo.</p>
        </div>
      `,
    });
  }
}