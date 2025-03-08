import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { softDeletePlugin } from 'soft-delete-plugin-mongoose';
import { CompaniesModule } from './companies/companies.module';
import { JobsModule } from './jobs/jobs.module';
import { FilesModule } from './files/files.module';
import { v2 as cloudinary } from 'cloudinary';
import { ResumesModule } from './resumes/resumes.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { DatabasesModule } from './databases/databases.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { loadTranslationsFromExcel } from './i18n/excel-loader';
import { AuthorsModule } from './authors/authors.module';
import { CategoriesModule } from './categories/categories.module';
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          connection.plugin(softDeletePlugin);
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    UsersModule,

    AuthModule,

    CompaniesModule,

    JobsModule,

    FilesModule,

    ResumesModule,

    PermissionsModule,

    RolesModule,

    DatabasesModule,

    SubscribersModule,

    MailModule,

    AuthorsModule,

    CategoriesModule,

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),

    HealthModule,

    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'CLOUDINARY',
      useFactory: (configService: ConfigService) => {
        cloudinary.config({
          cloud_name: configService.get<string>('CLD_CLOUD_NAME'),
          api_key: configService.get<string>('CLD_API_KEY'),
          api_secret: configService.get<string>('CLD_API_SECRET'),
        });
        return cloudinary;
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {
  constructor() {
    loadTranslationsFromExcel();
  }
}
