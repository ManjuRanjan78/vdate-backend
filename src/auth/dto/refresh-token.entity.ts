import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
 @PrimaryGeneratedColumn()
id!: number;

  @Column('text')
  userId!: string;

  @Column('text')
  token!: string;

  @Column({
    default: false,
  })
  isRevoked!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
