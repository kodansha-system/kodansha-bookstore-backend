import { IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DateRangeDto {
  @ApiProperty({
    example: '2024-05-01',
    description: 'Ngày bắt đầu (ISO 8601)',
  })
  @IsISO8601()
  @IsOptional()
  from: string;

  @ApiProperty({
    example: '2024-05-07',
    description: 'Ngày kết thúc (ISO 8601)',
  })
  @IsISO8601()
  @IsOptional()
  to: string;

  categoryId: string;
}
