import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bill } from './bill.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'bill_id' })
  billId: number;

  @ManyToOne(() => Bill, (bill) => bill.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @Column('decimal', { precision: 12, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  amountPaid: number;

  @Column({ name: 'payment_method', length: 20 })
  paymentMethod: string;

  @CreateDateColumn({ name: 'payment_date' })
  paymentDate: Date;
}
