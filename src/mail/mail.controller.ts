import { Controller, Get } from '@nestjs/common';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailerService) {}

  @Get('/')
  @Public()
  @ResponseMessage('Test mail')
  async handleTestEmail() {
    await this.mailService.sendMail({
      to: 'luongminhanh.thcstm@gmail.com',
      from: '"IT VIP pro" <abc@gmail.com>',
      subject: 'Just a test email',
      html: '<b>Hello</b>',
    });
  }
}
