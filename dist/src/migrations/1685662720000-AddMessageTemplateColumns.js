"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMessageTemplateColumns1685662720000 = void 0;
class AddMessageTemplateColumns1685662720000 {
    name = 'AddMessageTemplateColumns1685662720000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "message_templates" ADD "autoResponseId" integer`);
        await queryRunner.query(`ALTER TABLE "message_templates" ADD "isAutoResponse" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "message_templates" DROP COLUMN "isAutoResponse"`);
        await queryRunner.query(`ALTER TABLE "message_templates" DROP COLUMN "autoResponseId"`);
    }
}
exports.AddMessageTemplateColumns1685662720000 = AddMessageTemplateColumns1685662720000;
//# sourceMappingURL=1685662720000-AddMessageTemplateColumns.js.map