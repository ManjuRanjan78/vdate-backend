import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FriendStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

// This entity represents a friend request record (directional)
@Entity('friend_requests')
@Index(['senderId', 'receiverId', 'status'], { unique: true })
export class Friend {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  senderId!: number;

  @Column()
  receiverId!: number;

  @Column({
    type: 'enum',
    enum: FriendStatus,
    default: FriendStatus.PENDING,
  })
  status!: FriendStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}