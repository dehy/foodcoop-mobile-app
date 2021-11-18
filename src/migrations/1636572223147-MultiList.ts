import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiList1636572223147 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "lists" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "type" varchar NOT NULL,
                "name" text NOT NULL,
                "comment" text,
                "_createdAt" datetime NOT NULL DEFAULT (datetime('now')),
                "_lastModifiedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "_lastSentAt" date, "extraData" text
            )`,
        );
        await queryRunner.query(
            `CREATE TABLE "entries" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "type" varchar NOT NULL,
                "listId" integer,
                "productBarcode" varchar NOT NULL,
                "productId" integer NOT NULL,
                "productName" varchar NOT NULL,
                "quantity" float,
                "unit" integer,
                "price" float,
                "comment" text,
                "addedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "lastModifiedAt" datetime NOT NULL DEFAULT (datetime('now')),
                "extraData" text,
                CONSTRAINT "FK_listId_lists_id" FOREIGN KEY ("listId") REFERENCES "lists" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
        );
        await queryRunner.query(
            `CREATE TABLE "list_attachments" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "name" text NOT NULL,
                "path" text NOT NULL,
                "type" text NOT NULL,
                "listId" integer,
                CONSTRAINT "FK_listId_lists_id" FOREIGN KEY ("listId") REFERENCES "lists" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
            undefined,
        );

        await queryRunner.query(`DROP TABLE "attachment"`);
        await queryRunner.query(`DROP TABLE "goods_receipt_entry"`);
        await queryRunner.query(`DROP TABLE "goods_receipt_session"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // TODO
    }
}
