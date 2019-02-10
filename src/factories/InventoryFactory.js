'use strict'

import Database from '../utils/Database';
import Inventory from '../entities/Inventory';
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
        const inventory = new Inventory();
        inventory.id = Number(row.id);
        inventory.date = moment(row.date, 'YYYY-MM-DD');
        inventory.zone = Number(row.zone);

        return inventory;
    }
}