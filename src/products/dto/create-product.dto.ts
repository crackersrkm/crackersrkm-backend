import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockQuantity: number;

  @IsOptional()
  isActive?: boolean;
}
