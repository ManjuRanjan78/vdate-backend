import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddMessageTemplateColumns1685662720000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
