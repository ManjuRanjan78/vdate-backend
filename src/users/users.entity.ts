import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  HOST = 'host',
  AGENCY = 'agency',
  ADMIN = 'admin',
}

@Entity('users')
export class User {

  @PrimaryGeneratedColumn()
  id!: number;

  // =========================
  // AUTH
  // =========================

  @Column({
    unique: true,
    nullable: true,
  })
  phone!: string;

  @Column({
    unique: true,
    nullable: true,
  })
  email!: string;

  @Column({
    nullable: true,
  })
  googleId!: string;

  @Column({
    nullable: true,
  })
  facebookId!: string;

  // =========================
  // PROFILE
  // =========================

  @Column({
    nullable: true,
  })
  name!: string;

  @Index()
  @Column({
    nullable: true,
  })
  gender!: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  age!: number;

  @Column({
    type: 'date',
    nullable: true,
  })
  dob!: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio!: string;

  @Column({
    type: 'jsonb',
    default: [],
  })
  interests!: string[];

  @Column({
    nullable: true,
    default: '',
  })
  imageUrl!: string;

  @Column({
    nullable: true,
  })
  fcmToken!: string;

  // =========================
  // LOCATION
  // =========================

  @Column({
    type: 'double precision',
    nullable: true,
  })
  latitude!: number;

  @Column({
    type: 'double precision',
    nullable: true,
  })
  longitude!: number;

  @Column({
    nullable: true,
  })
  country!: string;

  @Column({
    nullable: true,
  })
  city!: string;

  @Column({
    nullable: true,
  })
  location!: string;

  // =========================
  // ACCOUNT STATUS
  // =========================

  @Column({
    default: false,
  })
  profileCompleted!: boolean;

  @Column({
    default: false,
  })
  isVerified!: boolean;

  @Index()
  @Column({
    default: false,
  })
  isOnline!: boolean;

  @Column({
    default: false,
  })
  isLive!: boolean;

  @Column({
    default: true,
  })
  isActive!: boolean;

  @Column({
    default: false,
  })
  hostApproved!: boolean;

  // =========================
  // ROLE
  // =========================

  @Index()
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    nullable: true,
  })
  agencyId!: string;

  // =========================
  // MONETIZATION
  // =========================

  @Index()
  @Column({
    type: 'int',
    default: 0,
  })
  coins!: number;

  // =========================
  // SOCIAL STATS
  // =========================

  @Column({
    default: 0,
  })
  followersCount!: number;

  @Column({
    default: 0,
  })
  followingCount!: number;

  @Column({
    default: 0,
  })
  likesCount!: number;

  @Column({
    default: 0,
  })
  viewerCount!: number;

  // =========================
  // ACTIVITY
  // =========================

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastActiveAt!: Date;

  // =========================
  // TIMESTAMPS
  // =========================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}