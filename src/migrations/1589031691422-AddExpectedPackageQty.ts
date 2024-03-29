import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddExpectedPackageQty1589031691422 implements MigrationInterface {
    name = 'AddExpectedPackageQty1589031691422';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "temporary_goods_receipt_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "packageQty" integer, "productQtyPackage" integer, "productBarcode" text NOT NULL, "productId" integer NOT NULL, "productName" text NOT NULL, "expectedProductQty" integer NOT NULL, "expectedProductUom" integer NOT NULL, "productQty" integer, "productUom" integer, "comment" text, "isExtra" boolean NOT NULL, "goodsReceiptSessionId" integer, "productSupplierCode" text, "expectedPackageQty" integer NOT NULL, "expectedProductQtyPackage" integer NOT NULL, CONSTRAINT "FK_4f4a24cf96742be07d7866ba5a0" FOREIGN KEY ("goodsReceiptSessionId") REFERENCES "goods_receipt_session" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
            undefined,
        );
        await queryRunner.query(
            `INSERT INTO "temporary_goods_receipt_entry"("id", "name", "expectedPackageQty", "expectedProductQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId", "productSupplierCode") SELECT "id", "name", "packageQty", "productQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId", "productSupplierCode" FROM "goods_receipt_entry"`,
            undefined,
        );
        await queryRunner.query(`DROP TABLE "goods_receipt_entry"`, undefined);
        await queryRunner.query(
            `ALTER TABLE "temporary_goods_receipt_entry" RENAME TO "goods_receipt_entry"`,
            undefined,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "goods_receipt_entry" RENAME TO "temporary_goods_receipt_entry"`,
            undefined,
        );
        await queryRunner.query(
            `CREATE TABLE "goods_receipt_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "packageQty" integer NOT NULL, "productQtyPackage" integer NOT NULL, "productBarcode" text NOT NULL, "productId" integer NOT NULL, "productName" text NOT NULL, "expectedProductQty" integer NOT NULL, "expectedProductUom" integer NOT NULL, "productQty" integer, "productUom" integer, "comment" text, "isExtra" boolean NOT NULL, "goodsReceiptSessionId" integer, "productSupplierCode" text, CONSTRAINT "FK_4f4a24cf96742be07d7866ba5a0" FOREIGN KEY ("goodsReceiptSessionId") REFERENCES "goods_receipt_session" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`,
            undefined,
        );
        await queryRunner.query(
            `INSERT INTO "goods_receipt_entry"("id", "name", "packageQty", "productQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId", "productSupplierCode") SELECT "id", "name", "expectedPackageQty", "expectedProductQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId", "productSupplierCode" FROM "temporary_goods_receipt_entry"`,
            undefined,
        );
        await queryRunner.query(`DROP TABLE "temporary_goods_receipt_entry"`, undefined);
    }
}
