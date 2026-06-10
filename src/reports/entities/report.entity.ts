import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reporterId!: number;

  @Column()
  reportedUserId!: number;

  @Column()
  targetId!: string;

  @Column()
  targetType!: string; // 'post' or 'user'

  @Column()
  reason!: string;

  @Column({ default: 'pending' })
  status!: string; // 'pending', 'resolved', 'rejected'

  @CreateDateColumn()
  createdAt!: Date;
}
