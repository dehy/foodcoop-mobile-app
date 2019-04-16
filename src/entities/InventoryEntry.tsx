'use strict'

import moment, { Moment } from 'moment';

export default class InventoryEntry {
    public id?: number;
    public inventoryId?: number;
    public articleBarcode?: string;
    public articleName?: string;
    public articleImage?: string;
    public articleUnit?: number;
    public articlePrice?: number;
    public scannedAt?: Moment;
    public articleQuantity?: number;
    public savedAt?: Moment;

    isFetchedFromOdoo() {
        if (this.articleUnit) {
            return true;
        }
        return false;
    }
}