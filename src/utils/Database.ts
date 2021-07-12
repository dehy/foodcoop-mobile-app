import SQLite from 'react-native-sqlite-storage';
import { toNumber } from './helpers';
import GoodsReceiptSession from '../entities/GoodsReceiptSession';
import GoodsReceiptEntry from '../entities/GoodsReceiptEntry';
import Attachment from '../entities/Attachment';

import BaseList from '../entities/Lists/BaseList';
import InventoryList from '../entities/Lists/InventoryList';

import BaseEntry from '../entities/Lists/BaseEntry';
import InventoryEntry from '../entities/Lists/InventoryEntry';

import ListAttachment from '../entities/Lists/ListAttachment';
import { createConnection, Connection, getConnection, getRepository } from 'typeorm';
import { Init1580395050084 } from '../migrations/1580395050084-Init';
import { UpdateGoodsReceiptEntry1588342677098 } from '../migrations/1588342677098-UpdateGoodsReceiptEntry';
import { DeleteCascade1588861598725 } from '../migrations/1588861598725-DeleteCascade';
import { AddExpectedPackageQty1589031691422 } from '../migrations/1589031691422-AddExpectedPackageQty';
import { AddSessionAttachment1592642586405 } from '../migrations/1592642586405-AddSessionAttachment';

interface EntityDefinition {
    name: string;
    tableName: string;
}

export default class Database {
    static TARGET_SCHEMA_VERSION = 2;

    private static instance: Database;
    private db?: SQLite.SQLiteDatabase;

    public static sharedInstance(): Database {
        if (Database.instance === undefined) {
            Database.instance = new Database();
        }

        return this.instance;
    }

    constructor() {
        this.db = undefined;
        SQLite.DEBUG(true);
        SQLite.enablePromise(true);
    }

    static async connect(): Promise<Connection> {
        let dropSchema = false;
        let synchronize = false;
        let migrationsRun = true;
        if (__DEV__) {
            dropSchema = true;
            synchronize = true;
            migrationsRun = false;
        }

        const connection = await createConnection({
            type: 'react-native',
            database: 'supercoop.sqlite',
            location: 'Documents',
            logging: true,
            dropSchema: dropSchema,
            synchronize: synchronize,
            entities: [
                Attachment,
                GoodsReceiptEntry,
                GoodsReceiptSession,
                BaseList,
                InventoryList,
                BaseEntry,
                InventoryEntry,
                ListAttachment,
            ],
            migrationsRun: migrationsRun,
            migrationsTableName: 'migrations',
            migrations: [
                Init1580395050084,
                UpdateGoodsReceiptEntry1588342677098,
                DeleteCascade1588861598725,
                AddExpectedPackageQty1589031691422,
                AddSessionAttachment1592642586405,
            ],
        });
        console.log("connection created");
        return connection;
    }

    async legacyConnect(): Promise<void> {
        if (this.db === undefined) {
            try {
                // await SQLite.echoTest();
                this.db = await SQLite.openDatabase({
                    name: 'inventory.db',
                    location: 'Library',
                });
                console.log('SQLite inventory.db database OPENED');
            } catch (error) {
                console.error(error);
            }
        }
    }

    async migrate(): Promise<boolean> {
        await this.legacyConnect();
        if (this.db === undefined) {
            console.error('No database open while trying to migrate');
            return false;
        }
        // Reset
        // await this.resetDatabase();
        // await this.db.executeSql('PRAGMA user_version = 0;');
        const currentSchemaVersion = await this.getCurrentSchemaVersion();

        if (currentSchemaVersion >= Database.TARGET_SCHEMA_VERSION) {
            console.info('No need for schema migration');
            return true;
        }
        console.info(`Schema migration needed from ${currentSchemaVersion} to ${Database.TARGET_SCHEMA_VERSION}`);

        const migrationData = require('../db/migrations.sql.json');

        for (const schemaVersionKey in migrationData) {
            const schemaVersion: number = toNumber(schemaVersionKey);
            const currentSchemaVersion = await this.getCurrentSchemaVersion();
            console.info(`Current schema version: ${currentSchemaVersion}`);
            console.info(`Processing schema version ${schemaVersion}`);
            if (schemaVersion <= currentSchemaVersion) {
                continue;
            }

            try {
                await this.db.transaction(tx => {
                    for (const statementKey in migrationData[schemaVersionKey]) {
                        tx.executeSql(migrationData[schemaVersionKey][statementKey]);
                    }
                    console.info(`Successfully migrated to schema version ${schemaVersion}`);
                });
                console.info(`Checking schema version: ${await this.getCurrentSchemaVersion()}`);
            } catch (e) {
                console.error(e);
                return false;
            }
        }
        return true;
    }

    async getCurrentSchemaVersion(): Promise<number> {
        if (this.db === undefined) {
            console.error('No database open while getting current schema version');
            return 99999;
        }
        let currentSchemaVersion: number;
        try {
            const userVersionResponses = await this.db.executeSql('PRAGMA user_version;');
            currentSchemaVersion = userVersionResponses[0].rows.item(0).user_version;
            return currentSchemaVersion;
        } catch (e) {
            console.error(e);
        }
        return 99999;
    }

    async resetDatabase(): Promise<boolean> {
        await this.legacyConnect();
        const response = await this.executeQuery("SELECT `name` FROM `sqlite_master` WHERE `type` = 'table'");
        if (response == undefined) {
            console.error('No response from database while selecting table names during database reset');
            return false;
        }
        const tablesToDelete = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            tablesToDelete.push(response[0].rows.item(i).name);
        }

        for (const key in tablesToDelete) {
            const tableName = tablesToDelete[key];
            await this.executeQuery('DROP TABLE `' + tableName + '`');
        }
        await this.executeQuery('PRAGMA user_version = 0');

        // TypeORM
        getConnection().synchronize();

        return true;
    }

    async executeQuery(statement: string, parameters: unknown[] = []): Promise<[SQLite.ResultSet]> {
        await this.legacyConnect();
        if (this.db === undefined) {
            throw new Error('No database open while executing query');
        }
        try {
            return await this.db.executeSql(statement, parameters);
        } catch (e) {
            console.error(e);
        }
        throw new Error();
    }

    async getEntities(): Promise<EntityDefinition[]> {
        const entities: EntityDefinition[] = [];
        (await (await getConnection()).entityMetadatas).forEach(x =>
            entities.push({ name: x.name, tableName: x.tableName }),
        );
        return entities;
    }

    async cleanAll(entities: EntityDefinition[]): Promise<void> {
        try {
            for (const entity of entities) {
                const repository = await getRepository(entity.name);
                await repository.query(`DELETE FROM \`${entity.tableName}\`;`);
            }
        } catch (error) {
            throw new Error(`ERROR: Cleaning test db: ${error}`);
        }
    }
}
