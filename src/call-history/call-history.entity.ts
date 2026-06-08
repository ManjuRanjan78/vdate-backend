import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('call_history')
export class CallHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  callId!: string;

  @Column({ type: 'int' })
  callerId!: number;

  @Column({ type: 'int' })
  receiverId!: number;

  @Column({ nullable: true })
  roomName!: string;

  @Column({ default: 'VIDEO' })
  callType!: string;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ default: 'STARTED' })
  status!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endedAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;
}
