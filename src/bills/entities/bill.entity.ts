import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { BillItem } from './bill-item.entity';
import { Payment } from './payment.entity';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bill_number', unique: true, length: 50 })
  billNumber: string;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer, { eager: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'bill_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  billDate: Date;

  @Column('decimal', { precision: 12, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  subtotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0.00, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  discount: number;

  @Column('decimal', { precision: 12, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  totalAmount: number;

  @Column('decimal', { name: 'paid_amount', precision: 12, scale: 2, default: 0.00, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  paidAmount: number;

  @Column('decimal', { name: 'pending_amount', precision: 12, scale: 2, default: 0.00, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  pendingAmount: number;

  @Column({ name: 'payment_status', length: 20, default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'payment_method', length: 20, default: 'cash' })
  paymentMethod: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => BillItem, (item) => item.bill, { cascade: true })
  items: BillItem[];

  @OneToMany(() => Payment, (payment) => payment.bill, { cascade: true })
  payments: Payment[];
}
