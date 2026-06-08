import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMissingTables1780233336102 implements MigrationInterface {
    name = 'CreateMissingTables1780233336102'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coin_transaction" DROP CONSTRAINT "FK_coin_transaction_payment"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payment_razorpay_orderid"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payment_razorpay_paymentid"`);
        await queryRunner.query(`CREATE TABLE "call_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "callId" character varying NOT NULL, "callerId" integer NOT NULL, "receiverId" integer NOT NULL, "roomName" character varying, "callType" character varying NOT NULL DEFAULT 'VIDEO', "duration" integer, "status" character varying NOT NULL DEFAULT 'STARTED', "startedAt" TIMESTAMP WITH TIME ZONE, "endedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_39277704b4caff7e7cebbf02bec" UNIQUE ("callId"), CONSTRAINT "PK_6587a86413c25970c7e5123b436" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" SERIAL NOT NULL, "user1Id" integer NOT NULL, "user2Id" integer NOT NULL, "lastMessage" character varying, "lastMessageAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5ecde0e8532667bde83d87ed0b" ON "conversations" ("user1Id") `);
        await queryRunner.query(`CREATE INDEX "IDX_47c90625a3eed92def079e1a78" ON "conversations" ("user2Id") `);
        await queryRunner.query(`CREATE TABLE "message_templates" ("id" SERIAL NOT NULL, "message" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_9ac2bd9635be662d183f314947d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "sender_id"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "receiver_id"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "is_read"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "conversationId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "senderId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "receiverId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "messageTemplateId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "isRead" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "coin_transaction" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "coin_transaction" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3914618818aaa075d8b8b6ec42" ON "payment" ("razorpayOrderId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8d4bbf8245e3730d1bc28c75d6" ON "payment" ("razorpayPaymentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5663ce0c730b2de83445e2fd1" ON "messages" ("conversationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2db9cf2b3ca111742793f6c37c" ON "messages" ("senderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_acf951a58e3b9611dd96ce8904" ON "messages" ("receiverId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_acf951a58e3b9611dd96ce8904"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2db9cf2b3ca111742793f6c37c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5663ce0c730b2de83445e2fd1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8d4bbf8245e3730d1bc28c75d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3914618818aaa075d8b8b6ec42"`);
        await queryRunner.query(`ALTER TABLE "coin_transaction" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "coin_transaction" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "payment" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "payment" ADD "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "isRead"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "messageTemplateId"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "receiverId"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "senderId"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "conversationId"`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "is_read" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "message" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "receiver_id" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messages" ADD "sender_id" integer NOT NULL`);
        await queryRunner.query(`DROP TABLE "message_templates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_47c90625a3eed92def079e1a78"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5ecde0e8532667bde83d87ed0b"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TABLE "call_history"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payment_razorpay_paymentid" ON "payment" ("razorpayPaymentId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_payment_razorpay_orderid" ON "payment" ("razorpayOrderId") `);
        await queryRunner.query(`ALTER TABLE "coin_transaction" ADD CONSTRAINT "FK_coin_transaction_payment" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
