import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/orders/orders.service';
import { PaymentStatus } from 'src/orders/schemas/order.schema';

@Injectable()
export class PayosWebhookService {
  private readonly checksumKey =
    this.configService.get<string>('PAYOS_CHECKSUM_KEY');

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
    private orderService: OrdersService,
  ) {}

  private sortObjDataByKey(object: any) {
    return Object.keys(object)
      .sort()
      .reduce((obj, key) => {
        obj[key] = object[key];
        return obj;
      }, {});
  }

  private convertObjToQueryStr(object: any) {
    return Object.keys(object)
      .filter((key) => object[key] !== undefined)
      .map((key) => {
        let value = object[key];
        if (value && Array.isArray(value)) {
          value = JSON.stringify(
            value.map((val) => this.sortObjDataByKey(val)),
          );
        }
        if ([null, undefined, 'undefined', 'null'].includes(value)) {
          value = '';
        }
        return `${key}=${value}`;
      })
      .join('&');
  }

  private isValidData(data: any, currentSignature: string): boolean {
    const sortedDataByKey = this.sortObjDataByKey(data);
    const dataQueryStr = this.convertObjToQueryStr(sortedDataByKey);
    const dataToSignature = createHmac('sha256', this.checksumKey)
      .update(dataQueryStr)
      .digest('hex');
    return dataToSignature === currentSignature;
  }

  async verifyWebhookUrl(body, res) {
    try {
      const isValid = this.isValidData(body.data, body.signature);
      if (isValid) {
        const { orderCode, code } = body.data;

        console.log(orderCode, code, body, 'orderCode');

        if (code === '00') {
          await this.orderService.updatePaymentStatus(
            orderCode,
            PaymentStatus.PAID,
          );
        }

        return res
          .status(200)
          .json({ message: 'Webhook received & processed.' });
      } else {
        console.log('Invalid signature!');
        return res.status(400).json({
          code: '01',
          desc: 'Invalid signature',
        });
      }
    } catch (error) {
      console.log(error);
      return {
        code: '500',
        desc: 'Error verifying webhook URL',
        data: error.response ? error.response.data : error.message,
      };
    }
  }
}
