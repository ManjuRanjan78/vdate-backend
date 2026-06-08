import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  packageId: string;

  @Column()
  amount: number;

  @Column()
  coins: number;

  @Column({ nullable: true })
  @Index({ unique: true })
  razorpayOrderId: string;

  @Column({ nullable: true })
  @Index({ unique: true })
  razorpayPaymentId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
