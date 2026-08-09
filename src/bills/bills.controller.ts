import { Controller, Post, Get, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bills')
@UseGuards(JwtAuthGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  async create(@Body() createBillDto: CreateBillDto) {
    return this.billsService.create(createBillDto);
  }

  @Get()
  async findAll() {
    return this.billsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billsService.findOne(id);
  }

  @Post(':id/payments')
  async addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body('amountPaid') amountPaid: number,
    @Body('paymentMethod') paymentMethod: string,
  ) {
    return this.billsService.addPayment(id, amountPaid, paymentMethod);
  }
}
