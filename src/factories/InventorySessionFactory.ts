'use strict';

import Database from '../utils/Database';
import InventorySession from '../entities/InventorySession';
import moment, { Moment } from 'moment';

interface InventorySessionDatabaseDefinition {
    id?: number;
    date?: Moment;
    zone?: number;
    last_modified_at?: Moment;
    last_sent_at?: Moment;
}

export default class InventoryFactory {
    private static instance: InventoryFactory;
    private db: Database;

    static sharedInstance(): InventoryFactory {
        if (InventoryFactory.instance === undefined) {
            InventoryFactory.instance = new InventoryFactory();
        }
        return this.instance;
    }

    constructor() {
        this.db = Database.sharedInstance();
    }

    async find(id: number): Promise<InventorySession> {
        const response = await this.db.executeQuery('SELECT * FROM `inventories` WHERE `id` = ? LIMIT 1', [id]);
        if (response[0].rows.length == 0) {
            console.error(`InventorySession #${id} not found!`);
        }
        return this._rowToObject(response[0].rows.item(0));
    }

    async findAll(): Promise<InventorySession[]> {
        const response = await this.db.executeQuery('SELECT * FROM `inventories` ORDER BY date DESC');
        const inventories = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            inventories.push(this._rowToObject(response[0].rows.item(i)));
        }

        return inventories;
    }

    async persist(object: InventorySession): Promise<void> {
        const params = this._objectToParams(object);
        // console.log(params);

        await this.db.executeQuery(
            'INSERT OR REPLACE INTO `inventories` (id, date, zone, last_modified_at, last_sent_at) VALUES (?, ?, ?, ?, ?)',
            params,
        );

        return;
    }

    async updateLastModifiedAt(inventorySession: InventorySession, date: Moment): Promise<void> {
        const id = inventorySession.id;
        const lastModifiedAt = date.format(Database.DATETIME_FORMAT);
        await this.db.executeQuery(`UPDATE inventories SET last_modified_at = ? WHERE id = ?;`, [lastModifiedAt, id]);

        return;
    }

    async updateLastSentAt(inventorySession: InventorySession, date: Moment): Promise<void> {
        const id = inventorySession.id;
        const lastSentAt = date.format(Database.DATETIME_FORMAT);
        await this.db.executeQuery(`UPDATE inventories SET last_sent_at = ? WHERE id = ?;`, [lastSentAt, id]);

        return;
    }

    _rowToObject(row: InventorySessionDatabaseDefinition): InventorySession {
        const inventorySession = new InventorySession();
        inventorySession.id = row.id;
        inventorySession.date = moment(row.date, Database.DATETIME_FORMAT);
        inventorySession.zone = row.zone;
        inventorySession.lastModifiedAt = row.last_modified_at
            ? moment(row.last_modified_at, Database.DATETIME_FORMAT)
            : undefined;
        inventorySession.lastSentAt = row.last_sent_at ? moment(row.last_sent_at, Database.DATETIME_FORMAT) : undefined;

        return inventorySession;
    }

    _objectToParams(object: InventorySession): any[] {
        const row = {
            id: object.id,
            date: object.date ? object.date.format(Database.DATETIME_FORMAT) : null,
            zone: object.zone,
            last_modified_at: object.lastModifiedAt ? object.lastModifiedAt.format(Database.DATETIME_FORMAT) : null,
            last_sent_at: object.lastSentAt ? object.lastSentAt.format(Database.DATETIME_FORMAT) : null,
        };

        const params = Object.values(row);
        return params;
    }
}
