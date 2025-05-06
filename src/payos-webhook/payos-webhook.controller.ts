// payos-webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { PayosWebhookService } from './payos-webhook.service';
import { Public } from 'src/decorator/customize';

@Controller('webhook')
export class PayosWebhookController {
  constructor(private readonly webhookService: PayosWebhookService) {}

  @Public()
  @Post('payos')
  async verifyWebhook(@Body() body: any, @Res() res) {
    const result = await this.webhookService.verifyWebhookUrl(body, res);

    if (result.code !== '200') {
      throw new HttpException(result.desc, HttpStatus.BAD_REQUEST);
    }
  }
}
