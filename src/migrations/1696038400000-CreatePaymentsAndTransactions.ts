import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsAndTransactions1696038400000 implements MigrationInterface {
  name = 'CreatePaymentsAndTransactions1696038400000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "packageId" varchar NOT NULL,
        "amount" integer NOT NULL,
        "coins" integer NOT NULL,
        "razorpayOrderId" varchar,
        "razorpayPaymentId" varchar,
        "status" varchar NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "coin_transaction" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "coins" integer NOT NULL,
        "type" varchar NOT NULL,
        "paymentId" integer,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'IDX_payment_razorpay_orderid') THEN
          CREATE UNIQUE INDEX "IDX_payment_razorpay_orderid" ON "payment" ("razorpayOrderId");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'IDX_payment_razorpay_paymentid') THEN
          CREATE UNIQUE INDEX "IDX_payment_razorpay_paymentid" ON "payment" ("razorpayPaymentId");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'coin_transaction' AND tc.constraint_name = 'FK_coin_transaction_payment') THEN
          ALTER TABLE "coin_transaction" ADD CONSTRAINT "FK_coin_transaction_payment" FOREIGN KEY ("paymentId") REFERENCES "payment" ("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "coin_transaction" DROP CONSTRAINT IF EXISTS "FK_coin_transaction_payment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_razorpay_orderid"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_razorpay_paymentid"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "coin_transaction"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment"`);
  }
}
