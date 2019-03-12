'use strict'

import Database from '../utils/Database';
import InventorySession from '../entities/InventorySession';
import moment from 'moment';

export default class InventoryFactory {
    static instance = null;

    static sharedInstance() {
        if (InventoryFactory.instance === null) {
            InventoryFactory.instance = new InventoryFactory();
        }
        return this.instance;
    }

    constructor() {
        this.db = Database.sharedInstance();
    }

    async find(id) {
        const response = await this.db.executeQuery('SELECT * FROM `inventories` WHERE `id` = ? LIMIT 1', [id]);
        if (response[0].rows.length == 0) {
            console.error(`InventorySession #${id} not found!`);
        }
        return this._rowToObject(response[0].rows.item(0));
    }

    async findAll() {
        const response = await this.db.executeQuery('SELECT * FROM `inventories` ORDER BY date DESC');
        const inventories = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            inventories.push(this._rowToObject(response[0].rows.item(i)));
        }

        return inventories;
    }

    async persist(object) {
        const params = this._objectToParams(object);
        console.log(params);

        const response = await this.db.executeQuery(
            'INSERT OR REPLACE INTO `inventories` (id, date, zone, last_modified_at, last_sent_at) VALUES (?, ?, ?, ?, ?)',
            params
        );

        return;
    }

    async updateLastModifiedAt(inventorySession, date) {
        const id = inventorySession.id;
        const lastModifiedAt = date.format(Database.DATETIME_FORMAT);
        const response = await this.db.executeQuery(
            `UPDATE inventories SET last_modified_at = ? WHERE id = ?;`,
            [lastModifiedAt, id]
        );

        return;
    }

    async updateLastSentAt(inventorySession, date) {
        const id = inventorySession.id;
        const lastSentAt = date.format(Database.DATETIME_FORMAT);
        const response = await this.db.executeQuery(
            `UPDATE inventories SET last_sent_at = ? WHERE id = ?;`,
            [lastSentAt, id]
        );

        return;
    }

    _rowToObject(row) {
        const inventorySession = new InventorySession();
        inventorySession.id = Number(row.id);
        inventorySession.date = moment(row.date, Database.DATE_FORMAT);
        inventorySession.zone = Number(row.zone);
        inventorySession.lastModifiedAt = row.last_modified_at ? moment(row.last_modified_at, Database.DATETIME_FORMAT) : null
        inventorySession.lastSentAt = row.last_sent_at ? moment(row.last_sent_at, Database.DATETIME_FORMAT) : null

        return inventorySession;
    }

    _objectToParams(object) {
        const row = {
            id: object.id,
            date: object.date.format(Database.DATE_FORMAT),
            zone: object.zone,
            last_modified_at: object.lastModifiedAt ? object.lastModifiedAt.format(Database.DATETIME_FORMAT) : null,
            last_sent_at: object.lastSentAt ? object.lastSentAt.format(Database.DATETIME_FORMAT) : null
        };

        const params = Object.values(row);
        return params;
    }
}