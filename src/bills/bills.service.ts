import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateBillDto } from './dto/create-bill.dto';
import { Bill } from './entities/bill.entity';
import { BillItem } from './entities/bill-item.entity';
import { Payment } from './entities/payment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class BillsService {
  constructor(private readonly dataSource: DataSource) {}

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const {
        customer: customerInput,
        discount = 0,
        paymentStatus = 'pending',
        paymentMethod = 'cash',
        items,
        paidAmount: paidInput,
        pendingAmount: pendingInput
      } = createBillDto;

      // 1. Handle Customer
      let customer = await queryRunner.manager.findOne(Customer, {
        where: { phone: customerInput.phone },
      });

      if (!customer) {
        customer = queryRunner.manager.create(Customer, {
          name: customerInput.name,
          phone: customerInput.phone,
          email: customerInput.email,
          address: customerInput.address,
          gstNumber: customerInput.gstNumber,
        });
        customer = await queryRunner.manager.save(Customer, customer);
      } else {
        // Update customer details if they are sent and have changed
        customer.name = customerInput.name || customer.name;
        customer.email = customerInput.email || customer.email;
        customer.address = customerInput.address || customer.address;
        customer.gstNumber = customerInput.gstNumber || customer.gstNumber;
        customer = await queryRunner.manager.save(Customer, customer);
      }

      // 2. Process Bill Items & Stock Check
      let subtotal = 0;
      const billItemsToSave: BillItem[] = [];

      for (const item of items) {
        // Fetch product with lock to prevent concurrent stock check issues
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (!product.isActive) {
          throw new BadRequestException(`Product '${product.name}' is not active`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product '${product.name}'. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
          );
        }

        // Deduct stock
        product.stockQuantity -= item.quantity;
        await queryRunner.manager.save(Product, product);

        const itemTotal = item.quantity * product.price;
        subtotal += itemTotal;

        const billItem = queryRunner.manager.create(BillItem, {
          productId: product.id,
          product: product,
          quantity: item.quantity,
          unitPrice: product.price,
          totalAmount: itemTotal,
        });
        billItemsToSave.push(billItem);
      }

      // 3. Generate Bill Number
      const now = new Date();
      // Year: get last 2 digits of year (e.g. 2026 -> 26)
      const yy = String(now.getFullYear()).slice(-2);
      // Month: 2 digits (e.g. August -> 08)
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `RKM${yy}${mm}`;

      // Query the latest bill matching this month's prefix
      const lastBill = await queryRunner.manager
        .getRepository(Bill)
        .createQueryBuilder('bill')
        .setLock('pessimistic_write')
        .where('bill.bill_number LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('bill.bill_number', 'DESC')
        .getOne();

      let nextSequenceStr = '0001';
      if (lastBill) {
        const lastBillNumber = lastBill.billNumber;
        const lastSequenceStr = lastBillNumber.slice(-4);
        const lastSequence = parseInt(lastSequenceStr, 10);
        if (!isNaN(lastSequence)) {
          const nextSequence = lastSequence + 1;
          nextSequenceStr = String(nextSequence).padStart(4, '0');
        }
      }
      const billNumber = `${prefix}${nextSequenceStr}`;

      // 4. Calculate Final Total and Save Bill
      const totalAmount = parseFloat((subtotal - discount).toFixed(2));
      if (totalAmount < 0) {
        throw new BadRequestException('Discount cannot exceed the bill subtotal');
      }

      let paidAmount = 0;
      let pendingAmount = totalAmount;
      let finalStatus = paymentStatus;

      if (paymentStatus === 'paid') {
        paidAmount = totalAmount;
        pendingAmount = 0;
      } else if (paymentStatus === 'pending') {
        paidAmount = 0;
        pendingAmount = totalAmount;
      } else if (paymentStatus === 'partially_paid') {
        paidAmount = paidInput !== undefined ? parseFloat(paidInput.toFixed(2)) : 0;
        pendingAmount = parseFloat((totalAmount - paidAmount).toFixed(2));
        if (pendingAmount <= 0) {
          finalStatus = 'paid';
          pendingAmount = 0;
          paidAmount = totalAmount;
        } else if (paidAmount <= 0) {
          finalStatus = 'pending';
          paidAmount = 0;
          pendingAmount = totalAmount;
        }
      }

      const bill = queryRunner.manager.create(Bill, {
        billNumber,
        customerId: customer.id,
        customer,
        billDate: now,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        totalAmount,
        paidAmount,
        pendingAmount,
        paymentStatus: finalStatus,
        paymentMethod,
        status: 'active',
      });

      const savedBill = await queryRunner.manager.save(Bill, bill);

      // Save initial payment if paidAmount > 0
      if (paidAmount > 0) {
        const payment = queryRunner.manager.create(Payment, {
          billId: savedBill.id,
          bill: savedBill,
          amountPaid: paidAmount,
          paymentMethod,
        });
        await queryRunner.manager.save(Payment, payment);
      }

      // 5. Assign Bill ID to items and save items
      for (const billItem of billItemsToSave) {
        billItem.billId = savedBill.id;
        billItem.bill = savedBill;
      }
      await queryRunner.manager.save(BillItem, billItemsToSave);

      await queryRunner.commitTransaction();

      // Return the saved bill with items without circular references
      savedBill.items = billItemsToSave.map(item => {
        delete item.bill;
        return item;
      });
      return savedBill;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: number): Promise<Bill> {
    const bill = await this.dataSource.getRepository(Bill).findOne({
      where: { id },
      relations: {
        customer: true,
        items: {
          product: true,
        },
        payments: true,
      },
      order: {
        payments: {
          paymentDate: 'ASC',
        },
      },
    });

    if (!bill) {
      throw new NotFoundException(`Bill with ID ${id} not found`);
    }
    return bill;
  }

  async findAll(): Promise<Bill[]> {
    return this.dataSource.getRepository(Bill).find({
      relations: {
        customer: true,
      },
      order: {
        billDate: 'DESC',
      },
    });
  }

  async addPayment(id: number, amountPaid: number, paymentMethod: string): Promise<Bill> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const bill = await queryRunner.manager
        .getRepository(Bill)
        .createQueryBuilder('bill')
        .setLock('pessimistic_write')
        .where('bill.id = :id', { id })
        .getOne();

      if (!bill) {
        throw new NotFoundException(`Bill with ID ${id} not found`);
      }

      const pendingAmt = Number(bill.pendingAmount);
      if (pendingAmt <= 0) {
        throw new BadRequestException('This invoice is already fully paid.');
      }

      if (amountPaid > pendingAmt) {
        throw new BadRequestException(`Payment amount (₹${amountPaid}) cannot exceed pending amount (₹${pendingAmt}).`);
      }

      // Record the new payment
      const payment = queryRunner.manager.create(Payment, {
        billId: bill.id,
        amountPaid: parseFloat(amountPaid.toFixed(2)),
        paymentMethod,
      });
      await queryRunner.manager.save(Payment, payment);

      // Update bill amounts
      bill.paidAmount = parseFloat((Number(bill.paidAmount) + amountPaid).toFixed(2));
      bill.pendingAmount = parseFloat((Number(bill.totalAmount) - bill.paidAmount).toFixed(2));

      // Update status
      if (bill.pendingAmount <= 0) {
        bill.paymentStatus = 'paid';
        bill.pendingAmount = 0;
      } else {
        bill.paymentStatus = 'partially_paid';
      }

      await queryRunner.manager.save(Bill, bill);
      await queryRunner.commitTransaction();

      // Retrieve full bill details to return
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
