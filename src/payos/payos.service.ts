import { Injectable } from '@nestjs/common';
import PayOS from '@payos/node';

@Injectable()
export class PayosService {
  private payos: PayOS;

  constructor() {
    this.payos = new PayOS(
      process.env.PAYOS_CLIENT_ID,
      process.env.PAYOS_API_KEY,
      process.env.PAYOS_CHECKSUM_KEY,
    );
  }

  async createPaymentLink(order: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    expiredAt: number;
  }) {
    return this.payos.createPaymentLink(order);
  }

  verifyWebhookData(data: any) {
    return this.payos.verifyPaymentWebhookData(data);
  }
}
