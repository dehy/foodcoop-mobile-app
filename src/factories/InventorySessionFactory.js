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
        return this._rowToObject(response[0].rows.item(0));
    }

    async findAll() {
        const response = await this.db.executeQuery('SELECT * FROM `inventories`');
        const inventories = [];
        for (let i = 0; i < response[0].rows.length; i++) {
            inventories.push(this._rowToObject(response[0].rows.item(i)));
        }

        return inventories;
    }

    _rowToObject(row) {
        const inventorySession = new InventorySession();
        inventorySession.id = Number(row.id);
        inventorySession.date = moment(row.date, 'YYYY-MM-DD');
        inventorySession.zone = Number(row.zone);

        return inventorySession;
    }
}