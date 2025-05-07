import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FlashSaleService } from './flashsales.service';
import { CreateFlashSaleDto } from './dto/create-flashsale.dto';

@ApiTags('flashsales')
@Controller('flashsales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Post()
  create(@Body() body: CreateFlashSaleDto) {
    return this.flashSaleService.create(body);
  }

  @Get()
  findAll() {
    return this.flashSaleService.findAll();
  }

  @Get('active')
  findActive() {
    return this.flashSaleService.findActive();
  }

  @Get('book/:bookId')
  getFlashSaleByBookId(@Param('bookId') bookId: string) {
    return this.flashSaleService.getFlashSaleByBookId(bookId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.flashSaleService.findById(id);
  }

  @Post(':id/buy')
  buyBook(
    @Param('id') flashSaleId: string,
    @Body() body: { bookId: string; quantity: number },
  ) {
    return this.flashSaleService.buy(flashSaleId, body.bookId, body.quantity);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashSaleService.remove(id);
  }
}
