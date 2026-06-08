import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class CoinTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  coins!: number;

  @Column()
  type!: string;

  @Column({ nullable: true })
  paymentId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
