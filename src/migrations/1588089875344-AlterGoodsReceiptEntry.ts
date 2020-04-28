import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterGoodsReceiptEntry1588089875344 implements MigrationInterface {
    name = 'AlterGoodsReceiptEntry1588089875344';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "goods_receipt_entry" ADD "productPartnerRef" text`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "goods_receipt_entry" DROP COLUMN "productPartnerRef"`, undefined);
    }
}
