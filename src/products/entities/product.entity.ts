import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column('decimal', { precision: 10, scale: 2, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  price: number;

  @Column({ name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
