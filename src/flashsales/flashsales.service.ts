import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { FlashSale, FlashSaleDocument } from './schemas/flashsale.schema';
import { CreateFlashSaleDto } from './dto/create-flashsale.dto';
@Injectable()
export class FlashSaleService {
  constructor(
    @InjectModel(FlashSale.name)
    private flashSaleModel: SoftDeleteModel<FlashSaleDocument>,
  ) {}

  async isTimeConflict(startTime: Date, endTime: Date): Promise<boolean> {
    const conflict = await this.flashSaleModel.exists({
      $or: [
        {
          start_time: { $lt: endTime },
          end_time: { $gt: startTime },
        },
      ],
    });
    return !!conflict;
  }

  async create(createDto: CreateFlashSaleDto) {
    const now = new Date();
    const start = new Date(createDto.start_time);
    const end = new Date(createDto.end_time);

    if (start <= now) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải nằm trong tương lai.',
      );
    }

    if (end <= start) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );
    }

    const isConflict = await this.isTimeConflict(start, end);
    if (isConflict) {
      throw new BadRequestException('Thời gian này đã có flash sale khác.');
    }

    return this.flashSaleModel.create(createDto);
  }

  // Lấy tất cả flash sale
  async findAll() {
    return this.flashSaleModel.find().sort({ start_time: -1 });
  }

  // Lấy flash sale theo id
  async findById(id: string) {
    return this.flashSaleModel.findById(id).populate('books.book_id');
  }

  // Lấy flash sale đang hoạt động (dành cho FE)
  async findActive() {
    const now = new Date();
    return this.flashSaleModel
      .findOne({
        start_time: { $lte: now },
        end_time: { $gte: now },
      })
      .populate('books.book_id');
  }

  // Mua 1 sách trong flash sale
  async buy(flashSaleId: string, bookId: string, quantity: number) {
    const flashSale = await this.flashSaleModel.findById(flashSaleId);
    if (!flashSale) throw new NotFoundException('Flash sale không tồn tại');

    const book = flashSale.books.find((b) => b.book_id.toString() === bookId);
    if (!book) throw new NotFoundException('Sách không thuộc flash sale');

    if (book.sold + quantity > book.quantity) {
      throw new BadRequestException('Không đủ số lượng');
    }

    // Update sold
    book.sold += quantity;
    await flashSale.save();

    return { message: 'Mua thành công', price: book.price * quantity };
  }

  // Xoá flash sale
  async remove(id: string) {
    return this.flashSaleModel.findByIdAndDelete(id);
  }

  async getFlashSaleByBookId(bookId: string) {
    const now = new Date();

    const flashSale = await this.flashSaleModel.findOne({
      start_time: { $lte: now },
      end_time: { $gte: now },
      'books.book_id': bookId,
    });

    if (!flashSale) {
      return { in_flash_sale: false };
    }

    const book = flashSale.books.find(
      (b) => b.book_id.toString() === bookId.toString(),
    );

    return {
      in_flash_sale: true,
      price: book.price,
      end_time: flashSale.end_time,
      flash_sale_id: flashSale._id,
    };
  }
}
