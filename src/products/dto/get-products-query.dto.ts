import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}
