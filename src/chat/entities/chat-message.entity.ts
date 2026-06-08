import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  roomId!: string;

  @Index()
  @Column({ type: 'int' })
  senderId!: number;

  @Index()
  @Column({ type: 'int' })
  receiverId!: number;

  @Column({ type: 'int', nullable: true })
  predefinedMessageId?: number;

  @Column({ type: 'text' })
  text!: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  readAt?: Date;

  @Column({ default: false })
  isAutoResponse!: boolean;

  @Column({ default: false })
  isSystem!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}
