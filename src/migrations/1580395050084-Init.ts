import {MigrationInterface, QueryRunner} from "typeorm";

export class Init1580395050084 implements MigrationInterface {
    name = 'Init1580395050084'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "goods_receipt_session" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "poId" integer NOT NULL, "poName" text NOT NULL, "partnerId" integer NOT NULL, "partnerName" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSentAt" date, "comment" text, "hidden" boolean NOT NULL)`, undefined);
        await queryRunner.query(`CREATE TABLE "goods_receipt_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "packageQty" integer NOT NULL, "productQtyPackage" integer NOT NULL, "productBarcode" text NOT NULL, "productId" integer NOT NULL, "productName" text NOT NULL, "expectedProductQty" integer NOT NULL, "expectedProductUom" integer NOT NULL, "productQty" integer, "productUom" integer, "comment" text, "isExtra" boolean NOT NULL, "goodsReceiptSessionId" integer)`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_goods_receipt_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "packageQty" integer NOT NULL, "productQtyPackage" integer NOT NULL, "productBarcode" text NOT NULL, "productId" integer NOT NULL, "productName" text NOT NULL, "expectedProductQty" integer NOT NULL, "expectedProductUom" integer NOT NULL, "productQty" integer, "productUom" integer, "comment" text, "isExtra" boolean NOT NULL, "goodsReceiptSessionId" integer, CONSTRAINT "FK_4f4a24cf96742be07d7866ba5a0" FOREIGN KEY ("goodsReceiptSessionId") REFERENCES "goods_receipt_session" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_goods_receipt_entry"("id", "name", "packageQty", "productQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId") SELECT "id", "name", "packageQty", "productQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId" FROM "goods_receipt_entry"`, undefined);
        await queryRunner.query(`DROP TABLE "goods_receipt_entry"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_goods_receipt_entry" RENAME TO "goods_receipt_entry"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "goods_receipt_entry" RENAME TO "temporary_goods_receipt_entry"`, undefined);
        await queryRunner.query(`CREATE TABLE "goods_receipt_entry" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "packageQty" integer NOT NULL, "productQtyPackage" integer NOT NULL, "productBarcode" text NOT NULL, "productId" integer NOT NULL, "productName" text NOT NULL, "expectedProductQty" integer NOT NULL, "expectedProductUom" integer NOT NULL, "productQty" integer, "productUom" integer, "comment" text, "isExtra" boolean NOT NULL, "goodsReceiptSessionId" integer)`, undefined);
        await queryRunner.query(`INSERT INTO "goods_receipt_entry"("id", "name", "packageQty", "productQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId") SELECT "id", "name", "packageQty", "productQtyPackage", "productBarcode", "productId", "productName", "expectedProductQty", "expectedProductUom", "productQty", "productUom", "comment", "isExtra", "goodsReceiptSessionId" FROM "temporary_goods_receipt_entry"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_goods_receipt_entry"`, undefined);
        await queryRunner.query(`DROP TABLE "goods_receipt_entry"`, undefined);
        await queryRunner.query(`DROP TABLE "goods_receipt_session"`, undefined);
    }

}
