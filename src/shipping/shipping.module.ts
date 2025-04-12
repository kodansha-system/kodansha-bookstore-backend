import { Module } from '@nestjs/common';
import { WebhookController } from './shipping.controller';

@Module({
  controllers: [WebhookController],
})
export class WebhookModule {}
