'use strict';

import { Moment } from 'moment';
import ProductProduct from './Odoo/ProductProduct';

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

    static createFromProductProduct(product: ProductProduct): InventoryEntry {
        const newEntry: InventoryEntry = new InventoryEntry();
        newEntry.articleBarcode = product.barcode;
        newEntry.articleName = product.name;
        newEntry.articleUnit = product.uomId;
        newEntry.articlePrice = product.lstPrice;
        return newEntry;
    }

    isFetchedFromOdoo(): boolean {
        if (this.articleUnit) {
            return true;
        }
        return false;
    }
}
