import {MigrationInterface, QueryRunner} from "typeorm";

export class HiddenGoodsReceipts1580064637315 implements MigrationInterface {
    name = 'HiddenGoodsReceipts1580064637315'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "temporary_goods_receipt_session" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "poId" integer NOT NULL, "poName" text NOT NULL, "partnerId" integer NOT NULL, "partnerName" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSentAt" date, "comment" text, "hidden" boolean NOT NULL)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_goods_receipt_session"("id", "poId", "poName", "partnerId", "partnerName", "createdAt", "updatedAt", "lastSentAt", "comment") SELECT "id", "poId", "poName", "partnerId", "partnerName", "createdAt", "updatedAt", "lastSentAt", "comment" FROM "goods_receipt_session"`, undefined);
        await queryRunner.query(`DROP TABLE "goods_receipt_session"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_goods_receipt_session" RENAME TO "goods_receipt_session"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "goods_receipt_session" RENAME TO "temporary_goods_receipt_session"`, undefined);
        await queryRunner.query(`CREATE TABLE "goods_receipt_session" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "poId" integer NOT NULL, "poName" text NOT NULL, "partnerId" integer NOT NULL, "partnerName" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "lastSentAt" date, "comment" text)`, undefined);
        await queryRunner.query(`INSERT INTO "goods_receipt_session"("id", "poId", "poName", "partnerId", "partnerName", "createdAt", "updatedAt", "lastSentAt", "comment") SELECT "id", "poId", "poName", "partnerId", "partnerName", "createdAt", "updatedAt", "lastSentAt", "comment" FROM "temporary_goods_receipt_session"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_goods_receipt_session"`, undefined);
    }

}
