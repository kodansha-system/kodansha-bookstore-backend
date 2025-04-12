import {
  Controller,
  Post,
  Body,
  Headers,
  Res,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { Public } from 'src/decorator/customize';
import { ConfigService } from '@nestjs/config';

@Controller('webhook')
export class WebhookController {
  private readonly CLIENT_SECRET: string;

  constructor(private readonly configService: ConfigService) {
    this.CLIENT_SECRET = this.configService.get<string>('CLIENT_SECRET');
  }

  @Public()
  @Post('order-status')
  async handleWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    hmacHeader: string,
    @Res() res: Response,
  ) {
    const headerKey =
      this.configService.get<string>('HEADER_KEY_WEBHOOK') || 'hmac';

    const isValid = this.verifySignature(body, hmacHeader);

    if (!isValid) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Invalid signature' });
    }

    return res.status(HttpStatus.OK).json({ message: 'Webhook received' });
  }

  private verifySignature(data: any, hmacHeader: string): boolean {
    const jsonData = JSON.stringify(data);
    const hash = crypto
      .createHmac('sha256', this.CLIENT_SECRET)
      .update(jsonData)
      .digest('base64');

    return hash === hmacHeader;
  }
}
