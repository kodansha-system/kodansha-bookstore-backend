import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { JobsModule } from 'src/jobs/jobs.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from 'src/jobs/schemas/job.schema';
import {
  Subscriber,
  SubscriberSchema,
} from 'src/subscribers/schemas/subscribers.schema';

@Module({
  controllers: [MailController],
  providers: [MailService],
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),

    MongooseModule.forFeature([
      { name: Subscriber.name, schema: SubscriberSchema },
    ]),

    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          secure: false,
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        preview: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class MailModule {}
