import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  isActive?: boolean;
}
