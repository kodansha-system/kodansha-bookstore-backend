import { Controller, Get } from '@nestjs/common';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectModel } from '@nestjs/mongoose';
import {
  Subscriber,
  SubscriberDocument,
} from 'src/subscribers/schemas/subscribers.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Job, JobDocument } from 'src/jobs/schemas/job.schema';

@Controller('mail')
export class MailController {
  constructor(
    private readonly mailService: MailerService,
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,
    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  @Get()
  @Public()
  @ResponseMessage('Test mail')
  async handleTestEmail() {
    const subscribers = await this.subscriberModel.find({});

    let jobMatchingSkills;
    for (const sub of subscribers) {
      const subSkills = sub?.skills;
      jobMatchingSkills = await this.jobModel
        .find({
          skills: { $in: subSkills },
        })
        .populate('company_id')
        .lean();
    }

    await this.mailService.sendMail({
      to: 'luongminhanh.thcstm@gmail.com',
      from: '"IT VIP pro" <abc@gmail.com>',
      subject: 'Just a test email',
      template: 'new-job',
      context: {
        receiver: 'Lương Minh Anh',
        jobs: jobMatchingSkills,
      },
    });
  }
}
