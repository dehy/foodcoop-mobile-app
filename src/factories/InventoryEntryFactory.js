'use strict'

import Database from '../utils/Database';
import Inventory from '../entities/Inventory';
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

    async findForInventory(inventoryId) {
        const response = await this.db.executeQuery('SELECT * FROM `inventories_entries` WHERE `inventory_id` = ?', [inventoryId]);
        const entries = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            entries.push(this._rowToObject(response[0].rows.item(i)));
        }

        return entries;
    }

    async findAll() {
        const response = await this.db.executeQuery('SELECT * FROM `inventories_entries`');
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
            'INSERT INTO `inventories_entries` VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            params
        );

        return;
    }

    _rowToObject(row) {
        const entry = new InventoryEntry();
        entry.id = Number(row.id);
        entry.inventoryId = Number(row.inventory_id);
        entry.articleBarcode = String(row.article_barcode);
        entry.articleName = String(row.article_name);
        entry.articleImage = row.article_image;
        entry.articleUnit = Number(row.article_unit);
        entry.articlePrice = Number(row.article_price);
        entry.scannedAt = moment(row.scanned_at, 'YYYY-MM-DD HH:MM:SS.SSS');
        entry.articleQuantity = Number(row.article_quantity);
        entry.savedAt = moment(row.saved_at, 'YYYY-MM-DD HH:MM:SS.SSS');

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
            scanned_at: object.scannedAt.format('YYYY-MM-DD HH:MM:SS.SSS'),
            article_quantity: object.articleQuantity,
            saved_at: object.scannedAt.format('YYYY-MM-DD HH:MM:SS.SSS')
        };

        const params = Object.values(row);
        return params;
    }
}