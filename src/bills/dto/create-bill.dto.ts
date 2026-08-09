import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerInputDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;
}

export class BillItemInputDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateBillDto {
  @ValidateNested()
  @Type(() => CustomerInputDto)
  customer: CustomerInputDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  discount?: number = 0.00;

  @IsString()
  @IsOptional()
  paymentStatus?: string = 'pending';

  @IsString()
  @IsOptional()
  paymentMethod?: string = 'cash';

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  paidAmount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pendingAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemInputDto)
  items: BillItemInputDto[];
}
