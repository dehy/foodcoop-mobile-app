import SQLite from 'react-native-sqlite-storage';

export default class Database {
    static TARGET_SCHEMA_VERSION = 1;

    static DATE_FORMAT="YYYY-MM-DD";
    static DATETIME_FORMAT="YYYY-MM-DD HH:mm:ss";

    static instance = null;

    static sharedInstance() {
        if (Database.instance === null) {
            Database.instance = new Database();
        }

        return this.instance;
    }

    constructor() {
        this.db = null;
        // SQLite.DEBUG(true);
        SQLite.enablePromise(true);
    }

    async connect() {
        if (this.db === null) {
            try {
                await SQLite.echoTest();
                this.db = await SQLite.openDatabase({
                    name: 'inventory.db',
                    location: 'Library'
                })
                console.log("SQLite inventory.db database OPENED");
            } catch (error) {
                console.error(error);
            }
        }
    }

    async migrate() {
        await this.connect();
        // Reset
        // await this.resetDatabase();
        // await this.db.executeSql('PRAGMA user_version = 0;');
        let currentSchemaVersion = await this.getCurrentSchemaVersion();

        if (currentSchemaVersion >= Database.TARGET_SCHEMA_VERSION) {
            console.info("No need for schema migration");
            return;
        }
        console.info(`Schema migration needed from ${currentSchemaVersion} to ${Database.TARGET_SCHEMA_VERSION}`);


        const migrationData = require("../db/migrations.sql.json");

        for (schemaVersion in migrationData) {
            const currentSchemaVersion = await this.getCurrentSchemaVersion();
            console.info(`Current schema version: ${currentSchemaVersion}`);
            console.info(`Processing schema version ${schemaVersion}`);
            if (schemaVersion <= currentSchemaVersion) {
                continue;
            }

            try {
                await this.db.transaction(tx => {
                    for (statementKey in migrationData[schemaVersion]) {
                        tx.executeSql(migrationData[schemaVersion][statementKey]);
                    }
                    console.info(`Successfully migrated to schema version ${schemaVersion}`);
                })
                console.info(`Checking schema version: ${await this.getCurrentSchemaVersion()}`);
            } catch (e) {
                console.error(e);
            }
        }
    }

    async getCurrentSchemaVersion() {
        let currentSchemaVersion;
        try {
            const userVersionResponses = await this.db.executeSql('PRAGMA user_version;');
            currentSchemaVersion = userVersionResponses[0].rows.item(0).user_version;
        } catch (e) {
            console.error(e);
        }

        return currentSchemaVersion;
    }

    async resetDatabase() {
        await this.connect();
        const response = await this.executeQuery("SELECT `name` FROM `sqlite_master` WHERE `type` = 'table'");
        const tablesToDelete = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            tablesToDelete.push(response[0].rows.item(i).name);
        }

        for (key in tablesToDelete) {
            const tableName = tablesToDelete[key];
            const response = await this.executeQuery("DROP TABLE `" + tableName +"`");
        }
        await this.executeQuery("PRAGMA user_version = 0");
    }

    async executeQuery(statement, parameters) {
        await this.connect();
        try {
            return await this.db.executeSql(statement, parameters);
        } catch (e) {
            console.error(e);
        }
    }
}