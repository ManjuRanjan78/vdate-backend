import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'int' })
  user1Id!: number;

  @Index()
  @Column({ type: 'int' })
  user2Id!: number;

  @Column({ nullable: true })
  lastMessage?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastMessageAt?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
