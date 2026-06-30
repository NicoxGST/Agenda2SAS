import { randomUUID } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MercadoPagoConfig,
  Payment as MercadoPagoPayment,
  Preference,
} from 'mercadopago';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

const DEPOSIT_AMOUNT = 100;

type ReservationPayload = {
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  contactPhone: string;
  clientNotes?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get mpClient() {
    return new MercadoPagoConfig({
      accessToken: this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN')!,
    });
  }

  async createCheckout(clientId: number, dto: CreateCheckoutDto) {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const backendUrl =
      this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3000';

    const externalRef = randomUUID();

    const preference = new Preference(this.mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'abono-reserva',
            title: 'Abono de reserva - LinaresTech',
            quantity: 1,
            unit_price: DEPOSIT_AMOUNT,
            currency_id: 'CLP',
          },
        ],
        back_urls: {
          success: `${frontendUrl}/pago/exito`,
          failure: `${frontendUrl}/pago/fallo`,
          pending: `${frontendUrl}/pago/pendiente`,
        },
        ...(frontendUrl.includes('localhost') ? {} : { auto_return: 'approved' }),
        external_reference: externalRef,
        notification_url: `${backendUrl}/payments/webhook`,
      },
    });

    await this.prisma.payment.create({
      data: {
        mpPreferenceId: externalRef,
        amount: DEPOSIT_AMOUNT,
        clientId,
        reservationData: {
          workerId: dto.workerId,
          serviceId: dto.serviceId,
          scheduledAt: dto.scheduledAt,
          contactPhone: dto.contactPhone,
          clientNotes: dto.clientNotes,
        },
      },
    });

    return { initPoint: result.init_point, externalRef };
  }

  async handleWebhook(body: any, query: any) {
    const type = body?.type ?? query?.topic;
    const paymentId = body?.data?.id ?? query?.id;

    if (type !== 'payment' || !paymentId) {
      return { received: true };
    }

    try {
      await this.processPayment(String(paymentId));
    } catch (err) {
      this.logger.error('Webhook processing error', err);
    }

    return { received: true };
  }

  async verifyByRef(externalRef: string) {
    const existing = await this.prisma.payment.findUnique({
      where: { mpPreferenceId: externalRef },
    });

    if (existing?.status === 'APPROVED') {
      return { status: 'approved', reservationId: existing.reservationId };
    }

    try {
      const paymentApi = new MercadoPagoPayment(this.mpClient);
      const results = await paymentApi.search({
        options: { external_reference: externalRef },
      });

      const mpPayment = results?.results?.find(
        (p) => p.status === 'approved' || p.status === 'in_process',
      );

      if (!mpPayment?.id) {
        return { status: existing?.status?.toLowerCase() ?? 'pending' };
      }

      await this.processPayment(String(mpPayment.id));
    } catch (err) {
      this.logger.error('VerifyByRef error', err);
      return { status: 'error' };
    }

    const updated = await this.prisma.payment.findUnique({
      where: { mpPreferenceId: externalRef },
    });

    if (updated?.status === 'APPROVED') {
      return { status: 'approved', reservationId: updated.reservationId };
    }

    return { status: updated?.status?.toLowerCase() ?? 'pending' };
  }

  async verifyPayment(mpPaymentId: string) {
    const existing = await this.prisma.payment.findFirst({
      where: { mpPaymentId },
    });

    if (existing?.status === 'APPROVED') {
      return { status: 'approved', reservationId: existing.reservationId };
    }

    try {
      await this.processPayment(mpPaymentId);
    } catch (err) {
      this.logger.error('Verify payment error', err);
      return { status: 'error' };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { mpPaymentId },
    });

    if (payment?.status === 'APPROVED') {
      return { status: 'approved', reservationId: payment.reservationId };
    }

    return { status: payment?.status?.toLowerCase() ?? 'pending' };
  }

  private async processPayment(mpPaymentId: string) {
    const paymentApi = new MercadoPagoPayment(this.mpClient);
    const mpPayment = await paymentApi.get({ id: Number(mpPaymentId) });

    const externalRef = mpPayment.external_reference;
    if (!externalRef) return;

    const payment = await this.prisma.payment.findUnique({
      where: { mpPreferenceId: externalRef },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for external_reference: ${externalRef}`);
      return;
    }

    if (!payment.mpPaymentId) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { mpPaymentId: String(mpPaymentId) },
      });
    }

    if (payment.reservationId) return;

    if (mpPayment.status === 'approved' || mpPayment.status === 'in_process') {
      await this.createReservationFromPayment(payment);
    } else if (mpPayment.status === 'rejected') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REJECTED' },
      });
    } else if (mpPayment.status === 'cancelled') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED' },
      });
    }
  }

  private async createReservationFromPayment(payment: {
    id: number;
    clientId: number;
    amount: number;
    reservationData: unknown;
  }) {
    const data = payment.reservationData as ReservationPayload;

    const reservation = await this.prisma.reservation.create({
      data: {
        clientId: payment.clientId,
        workerId: data.workerId,
        serviceId: data.serviceId,
        scheduledAt: new Date(data.scheduledAt),
        contactPhone: data.contactPhone,
        clientNotes: data.clientNotes ?? null,
        depositAmount: payment.amount,
        status: 'CONFIRMED',
      },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'APPROVED',
        reservationId: reservation.id,
      },
    });

    this.logger.log(
      `Reservation ${reservation.id} created from payment ${payment.id}`,
    );

    return reservation;
  }
}
