import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessageTemplateColumns1685662720000 implements MigrationInterface {
  name = 'AddMessageTemplateColumns1685662720000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message_templates" ADD "autoResponseId" integer`);
    await queryRunner.query(`ALTER TABLE "message_templates" ADD "isAutoResponse" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message_templates" DROP COLUMN "isAutoResponse"`);
    await queryRunner.query(`ALTER TABLE "message_templates" DROP COLUMN "autoResponseId"`);
  }
}
