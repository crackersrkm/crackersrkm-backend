import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ length: 150, nullable: true })
  email: string;

  @Column('text', { nullable: true })
  address: string;

  @Column({ name: 'gst_number', length: 50, nullable: true })
  gstNumber: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
