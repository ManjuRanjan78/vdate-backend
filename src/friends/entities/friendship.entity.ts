import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from 'typeorm';

@Entity('friendships')
@Unique(['user1Id', 'user2Id'])
export class Friendship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user1Id!: number;

  @Column()
  user2Id!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
