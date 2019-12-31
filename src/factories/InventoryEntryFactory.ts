'use strict';

import Database from '../utils/Database';
import InventorySession from '../entities/InventorySession';
import moment from 'moment';
import InventoryEntry from '../entities/InventoryEntry';
import ProductProduct from '../entities/Odoo/ProductProduct';

interface InventoryEntryTableDefinition {
    id?: number;
    inventory_id?: number;
    article_barcode?: string;
    article_name?: string;
    article_image?: string;
    article_unit?: number;
    article_price?: number;
    scanned_at?: string;
    article_quantity?: number;
    saved_at?: string;
}

export default class InventoryEntryFactory {
    private static instance: InventoryEntryFactory;
    private db: Database;

    static sharedInstance(): InventoryEntryFactory {
        if (InventoryEntryFactory.instance === undefined) {
            InventoryEntryFactory.instance = new InventoryEntryFactory();
        }
        return this.instance;
    }

    constructor() {
        this.db = Database.sharedInstance();
    }

    async findByInventorySessionAndProductProduct(
        inventorySession: InventorySession,
        product: ProductProduct,
    ): Promise<InventoryEntry[]> {
        if (!inventorySession.id || !product.barcode) {
            throw new Error();
        }
        const response = await this.db.executeQuery(
            'SELECT * FROM `inventories_entries` WHERE `inventory_id` = ? AND `article_barcode` = ? ORDER BY scanned_at DESC',
            [inventorySession.id.toString(), product.barcode],
        );
        const entries = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            entries.push(this._rowToObject(response[0].rows.item(i)));
        }

        return entries;
    }

    async findForInventorySession(inventorySession: InventorySession): Promise<InventoryEntry[]> {
        if (!inventorySession.id) {
            console.error('InventorySession has no id');
            throw new Error('InventorySession has no id');
        }
        return await this.findForInventorySessionId(inventorySession.id);
    }

    async findForInventorySessionId(inventorySessionId: number): Promise<InventoryEntry[]> {
        const response = await this.db.executeQuery(
            'SELECT * FROM `inventories_entries` WHERE `inventory_id` = ? ORDER BY `saved_at` DESC',
            [inventorySessionId.toString()],
        );
        const entries = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            entries.push(this._rowToObject(response[0].rows.item(i)));
        }

        return entries;
    }

    async findAll(): Promise<InventoryEntry[]> {
        const response = await this.db.executeQuery('SELECT * FROM `inventories_entries`');
        const inventorySessions = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            inventorySessions.push(this._rowToObject(response[0].rows.item(i)));
        }

        return inventorySessions;
    }

    async persist(object: InventoryEntry): Promise<void> {
        const params = this._objectToParams(object);

        await this.db.executeQuery('INSERT INTO `inventories_entries` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params);

        return;
    }

    async update(object: InventoryEntry): Promise<void> {
        const params = this._objectToParams(object);
        // console.log(params);

        await this.db.executeQuery('INSERT INTO `inventories_entries` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', params);

        return;
    }

    async delete(object: InventoryEntry): Promise<void> {
        if (!object.id) {
            throw new Error('Cannot delete InventoryEntry with no id!');
        }
        const params: (string | number)[] = [object.id];

        await this.db.executeQuery('DELETE FROM `inventories_entries` WHERE `id` = ?;', params);

        return;
    }

    _rowToObject(row: InventoryEntryTableDefinition): InventoryEntry {
        // console.debug('inventories_entries row', row);
        const entry = new InventoryEntry();
        entry.id = row.id;
        entry.inventoryId = row.inventory_id;
        entry.articleBarcode = String(row.article_barcode);
        entry.articleName = String(row.article_name);
        entry.articleImage = row.article_image;
        entry.articleUnit = row.article_unit;
        entry.articlePrice = row.article_price;
        entry.scannedAt = moment(row.scanned_at, Database.DATETIME_FORMAT);
        entry.articleQuantity = row.article_quantity;
        entry.savedAt = moment(row.saved_at, Database.DATETIME_FORMAT);

        return entry;
    }

    _objectToParams(object: InventoryEntry): any[] {
        const row = {
            id: object.id,
            inventory_id: object.inventoryId,
            article_barcode: object.articleBarcode,
            article_name: object.articleName,
            article_image: null,
            article_unit: object.articleUnit,
            article_price: object.articlePrice,
            scanned_at: object.scannedAt ? object.scannedAt.format(Database.DATETIME_FORMAT) : null,
            article_quantity: object.articleQuantity,
            saved_at: object.savedAt ? object.savedAt.format(Database.DATETIME_FORMAT) : null,
        };

        const params = Object.values(row);
        return params;
    }
}
