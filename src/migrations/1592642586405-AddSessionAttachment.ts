import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSessionAttachment1592642586405 implements MigrationInterface {
    name = 'AddSessionAttachment1592642586405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attachment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "path" text NOT NULL, "type" text NOT NULL, "goodsReceiptSessionId" integer)`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_attachment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "path" text NOT NULL, "type" text NOT NULL, "goodsReceiptSessionId" integer, CONSTRAINT "FK_f729d096f872d0a5b8e66d64b9d" FOREIGN KEY ("goodsReceiptSessionId") REFERENCES "goods_receipt_session" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_attachment"("id", "name", "path", "type", "goodsReceiptSessionId") SELECT "id", "name", "path", "type", "goodsReceiptSessionId" FROM "attachment"`, undefined);
        await queryRunner.query(`DROP TABLE "attachment"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_attachment" RENAME TO "attachment"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachment" RENAME TO "temporary_attachment"`, undefined);
        await queryRunner.query(`CREATE TABLE "attachment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "path" text NOT NULL, "type" text NOT NULL, "goodsReceiptSessionId" integer)`, undefined);
        await queryRunner.query(`INSERT INTO "attachment"("id", "name", "path", "type", "goodsReceiptSessionId") SELECT "id", "name", "path", "type", "goodsReceiptSessionId" FROM "temporary_attachment"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_attachment"`, undefined);
        await queryRunner.query(`DROP TABLE "attachment"`, undefined);
    }

}
