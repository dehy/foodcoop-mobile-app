'use strict';

import BaseList from '../entities/Lists/BaseList';
import InventoryList from '../entities/Lists/InventoryList';
import GoodsReceiptList from '../entities/Lists/GoodsReceiptList';

import BaseEntry from '../entities/Lists/BaseEntry';
import InventoryEntry from '../entities/Lists/InventoryEntry';
import GoodsReceiptEntry from '../entities/Lists/GoodsReceiptEntry';

import ListAttachment from '../entities/Lists/ListAttachment';
import {createConnection, Connection, getConnection, getRepository} from 'typeorm';
import {Init1580395050084} from '../migrations/1580395050084-Init';
import {UpdateGoodsReceiptEntry1588342677098} from '../migrations/1588342677098-UpdateGoodsReceiptEntry';
import {DeleteCascade1588861598725} from '../migrations/1588861598725-DeleteCascade';
import {AddExpectedPackageQty1589031691422} from '../migrations/1589031691422-AddExpectedPackageQty';
import {AddSessionAttachment1592642586405} from '../migrations/1592642586405-AddSessionAttachment';
import {MultiList1636572223147} from '../migrations/1636572223147-MultiList';

interface EntityDefinition {
    name: string;
    tableName: string;
}

export default class Database {
    private static instance: Database;

    public static sharedInstance(): Database {
        if (Database.instance === undefined) {
            Database.instance = new Database();
        }

        return this.instance;
    }

    static async connect(): Promise<Connection> {
        let dropSchema = false;
        let synchronize = false;
        let migrationsRun = true;
        if (__DEV__) {
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
                BaseList,
                InventoryList,
                GoodsReceiptList,
                BaseEntry,
                InventoryEntry,
                GoodsReceiptEntry,
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
                MultiList1636572223147,
            ],
        });
        console.log('connection created');
        return connection;
    }

    async resetDatabase(): Promise<boolean> {
        getConnection().synchronize(true);

        return true;
    }

    async getEntities(): Promise<EntityDefinition[]> {
        const entities: EntityDefinition[] = [];
        getConnection().entityMetadatas.forEach(x => entities.push({name: x.name, tableName: x.tableName}));
        return entities;
    }

    async cleanAll(entities: EntityDefinition[]): Promise<void> {
        try {
            for (const entity of entities) {
                const repository = getRepository(entity.name);
                await repository.query(`DELETE FROM \`${entity.tableName}\`;`);
            }
        } catch (error) {
            throw new Error(`ERROR: Cleaning test db: ${error}`);
        }
    }
}
