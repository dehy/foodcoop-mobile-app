'use strict';

import InventoryEntry from '../entities/Lists/InventoryEntry';
import GoodsReceiptEntry from '../entities/Lists/GoodsReceiptEntry';

import {DataSource} from 'typeorm';
import {Init1580395050084} from '../migrations/1580395050084-Init';
import {UpdateGoodsReceiptEntry1588342677098} from '../migrations/1588342677098-UpdateGoodsReceiptEntry';
import {DeleteCascade1588861598725} from '../migrations/1588861598725-DeleteCascade';
import {AddExpectedPackageQty1589031691422} from '../migrations/1589031691422-AddExpectedPackageQty';
import {AddSessionAttachment1592642586405} from '../migrations/1592642586405-AddSessionAttachment';
import {MultiList1636572223147} from '../migrations/1636572223147-MultiList';
import LabelEntry from '../entities/Lists/LabelEntry';
import { BaseListEntity } from '../entities/Lists/BaseListEntity';
import { InventoryListEntity } from '../entities/Lists/InventoryListEntity';
import { GoodsReceiptListEntity } from '../entities/Lists/GoodsReceiptListEntity';
import { BaseEntryEntity } from '../entities/Lists/BaseEntryEntity';
import { LabelListEntity } from '../entities/Lists/LabelListEntity';
import { ListAttachmentEntity } from '../entities/Lists/ListAttachmentEntity';

interface EntityDefinition {
    name: string;
    tableName: string;
}

export default class Database {
    private static instance: Database;
    public dataSource: DataSource;

    constructor(database: string) {
        let dropSchema = false;
        let synchronize = false;
        let migrationsRun = true;
        if (__DEV__) {
            synchronize = true;
            migrationsRun = false;
        }

        this.dataSource = new DataSource({
            type: 'react-native',
            database: database,
            location: 'Documents',
            logging: true,
            dropSchema: dropSchema,
            synchronize: synchronize,
            entities: [
                BaseListEntity,
                InventoryListEntity,
                GoodsReceiptListEntity,
                BaseEntryEntity,
                InventoryEntry,
                GoodsReceiptEntry,
                LabelListEntity,
                LabelEntry,
                ListAttachmentEntity,
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

        this.dataSource
            .initialize()
            .then(() => {
                console.log('Data Source has been initialized!');
            })
            .catch(err => {
                console.error('Error during Data Source initialization', err);
            });
    }

    public static sharedInstance(): Database {
        if (Database.instance === undefined) {
            Database.instance = new Database('supercoop.sqlite');
        }

        return this.instance;
    }

    async resetDatabase(): Promise<boolean> {
        this.dataSource.synchronize(true);

        return true;
    }

    async getEntities(): Promise<EntityDefinition[]> {
        const entities: EntityDefinition[] = [];
        this.dataSource.entityMetadatas.forEach(x => entities.push({name: x.name, tableName: x.tableName}));
        return entities;
    }

    async cleanAll(entities: EntityDefinition[]): Promise<void> {
        try {
            for (const entity of entities) {
                const repository = this.dataSource.getRepository(entity.name);
                await repository.query(`DELETE FROM \`${entity.tableName}\`;`);
            }
        } catch (error) {
            throw new Error(`ERROR: Cleaning test db: ${error}`);
        }
    }
}
