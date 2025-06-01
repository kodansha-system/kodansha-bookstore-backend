import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistic.services';
import { DateRangeDto } from './dto/overview.dto';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview(@Query() query: DateRangeDto) {
    return this.statisticsService.getOverview(query.from, query.to);
  }

  @Get('top-books')
  @Public()
  async getTopBooks(@Query() query: DateRangeDto) {
    return this.statisticsService.getTopBooks(query.from, query.to);
  }

  @Get('top-books-by-category')
  @Public()
  async getTopBooksByCategoryId(@Query() query: DateRangeDto) {
    return this.statisticsService.getTopBooks(
      undefined,
      undefined,
      query.categoryId,
    );
  }

  @Get('top-customers')
  @Public()
  async getTopCustomers(@Query() query: DateRangeDto) {
    return this.statisticsService.getTopCustomers(query.from, query.to);
  }
}
