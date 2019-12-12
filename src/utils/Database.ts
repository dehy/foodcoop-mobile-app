import SQLite from 'react-native-sqlite-storage';
import './helpers';
import { toNumber } from './helpers';
import GoodsReceiptSession from '../entities/GoodsReceiptSession';
import GoodsReceiptEntry from '../entities/GoodsReceiptEntry';
import { createConnection, Connection } from 'typeorm';

export default class Database {
    static TARGET_SCHEMA_VERSION = 2;

    public static DATE_FORMAT = 'YYYY-MM-DD';
    public static DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

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
        // SQLite.DEBUG(true);
        SQLite.enablePromise(true);
    }

    static connect(): Promise<Connection> {
        return createConnection({
            type: 'react-native',
            database: 'supercoop',
            location: 'Documents',
            logging: ['error', 'query', 'schema'],
            //dropSchema: true,
            synchronize: true,
            entities: [GoodsReceiptSession, GoodsReceiptEntry],
        });
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
}
