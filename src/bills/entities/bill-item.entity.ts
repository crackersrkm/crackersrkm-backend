import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bill } from './bill.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('bill_items')
export class BillItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bill_id' })
  billId: number;

  @ManyToOne(() => Bill, (bill) => bill.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill?: Bill;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  unitPrice: number;

  @Column('decimal', { precision: 12, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  totalAmount: number;
}
