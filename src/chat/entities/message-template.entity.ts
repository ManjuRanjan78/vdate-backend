import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  autoResponseId: number;

  @Column({ default: false })
  isAutoResponse: boolean;
}
