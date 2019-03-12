'use strict'

import Database from '../utils/Database';
import InventorySession from '../entities/InventorySession';
import moment from 'moment';
import InventoryEntry from '../entities/InventoryEntry';

export default class InventoryEntryFactory {
    static instance = null;

    static sharedInstance() {
        if (InventoryEntryFactory.instance === null) {
            InventoryEntryFactory.instance = new InventoryEntryFactory();
        }
        return this.instance;
    }

    constructor() {
        this.db = Database.sharedInstance();
    }

    async findForInventorySession(inventorySession) {
        return await this.findForInventorySessionId(inventorySession.id);
    }

    async findForInventorySessionId(inventorySessionId) {
        const response = await this.db.executeQuery('SELECT * FROM `inventories_entries` WHERE `inventory_id` = ? ORDER BY `saved_at` DESC', [inventorySessionId]);
        const entries = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            entries.push(this._rowToObject(response[0].rows.item(i)));
        }

        return entries;
    }

    async findAll() {
        const response = await this.db.executeQuery('SELECT * FROM `inventories_entries`');
        const inventorySessions = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            inventorySessions.push(this._rowToObject(response[0].rows.item(i)));
        }

        return inventorySessions;
    }

    async persist(object) {
        const params = this._objectToParams(object);

        const response = await this.db.executeQuery(
            'INSERT OR REPLACE INTO `inventories_entries` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            params
        );

        return;
    }

    async update(object) {
        const params = this._objectToParams(object);
        console.log(params);

        const response = await this.db.executeQuery(
            'INSERT INTO `inventories_entries` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            params
        );

        return;
    }

    async delete(object) {
        const params = [object.id];

        const response = await this.db.executeQuery(
            'DELETE FROM `inventories_entries` WHERE `id` = ?;',
            params
        );

        return;
    }

    _rowToObject(row) {
        console.debug("inventories_entries row", row);
        const entry = new InventoryEntry();
        entry.id = Number(row.id);
        entry.inventoryId = Number(row.inventory_id);
        entry.articleBarcode = String(row.article_barcode);
        entry.articleName = String(row.article_name);
        entry.articleImage = row.article_image;
        entry.articleUnit = Number(row.article_unit);
        entry.articlePrice = Number(row.article_price);
        entry.scannedAt = moment(row.scanned_at, Database.DATETIME_FORMAT);
        entry.articleQuantity = Number(row.article_quantity);
        entry.savedAt = moment(row.saved_at, Database.DATETIME_FORMAT);

        return entry;
    }

    _objectToParams(object) {
        const row = {
            id: object.id,
            inventory_id: object.inventoryId,
            article_barcode: object.articleBarcode,
            article_name: object.articleName,
            article_image: null,
            article_unit: object.articleUnit,
            article_price: object.articlePrice,
            scanned_at: object.scannedAt.format(Database.DATETIME_FORMAT),
            article_quantity: object.articleQuantity,
            saved_at: object.savedAt.format(Database.DATETIME_FORMAT)
        };

        const params = Object.values(row);
        return params;
    }
}