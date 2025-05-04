import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FlashSaleService } from './flashsales.service';
import { CreateFlashSaleDto } from './dto/create-flashsale.dto';

@ApiTags('flashsales')
@Controller('flashsales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  // Tạo flash sale
  @Post()
  create(@Body() body: CreateFlashSaleDto) {
    return this.flashSaleService.create(body);
  }

  // Lấy tất cả flash sale
  @Get()
  findAll() {
    return this.flashSaleService.findAll();
  }

  // Lấy flash sale đang hoạt động (cho FE)
  @Get('active')
  findActive() {
    return this.flashSaleService.findActive();
  }

  // Lấy flash sale đang hoạt động (cho FE)
  @Get('book/:bookId')
  getFlashSaleByBookId(@Param('bookId') bookId: string) {
    return this.flashSaleService.getFlashSaleByBookId(bookId);
  }

  // Lấy chi tiết flash sale
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.flashSaleService.findById(id);
  }

  // Mua sách trong flash sale
  @Post(':id/buy')
  buyBook(
    @Param('id') flashSaleId: string,
    @Body() body: { bookId: string; quantity: number },
  ) {
    return this.flashSaleService.buy(flashSaleId, body.bookId, body.quantity);
  }

  // Xoá flash sale
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashSaleService.remove(id);
  }
}
