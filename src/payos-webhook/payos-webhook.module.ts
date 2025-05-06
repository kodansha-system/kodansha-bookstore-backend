import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PayosWebhookService } from './payos-webhook.service';
import { PayosWebhookController } from './payos-webhook.controller';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [HttpModule, OrdersModule],
  controllers: [PayosWebhookController],
  providers: [PayosWebhookService],
})
export class PayosWebhookModule {}
