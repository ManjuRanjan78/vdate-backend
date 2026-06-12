import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreatePaymentsAndTransactions1696038400000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
