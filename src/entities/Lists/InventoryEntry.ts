'use strict';

import {ChildEntity} from 'typeorm';
import ProductProduct from '../Odoo/ProductProduct';
import BaseEntry from './BaseEntry';

export type InventoryEntryExtraData = {
    newQuantity: number;
    scannedAt: Date;
};

@ChildEntity()
export default class InventoryEntry extends BaseEntry {
    static createFromProductProduct(product: ProductProduct): InventoryEntry {
        const newEntry: InventoryEntry = new InventoryEntry();
        newEntry.productBarcode = product.barcode;
        newEntry.productId = product.id;
        newEntry.productName = product.name;
        newEntry.unit = product.uomId;
        newEntry.price = product.lstPrice;
        newEntry.quantity = product.qtyAvailable;
        return newEntry;
    }

    get newQuantity(): number {
        return (this.extraData as InventoryEntryExtraData).newQuantity;
    }

    set newQuantity(newQuantity: number) {
        (this.extraData as InventoryEntryExtraData).newQuantity = newQuantity;
    }

    get scannedAt(): Date {
        return (this.extraData as InventoryEntryExtraData).scannedAt;
    }

    set scannedAt(scannedAt: Date) {
        (this.extraData as InventoryEntryExtraData).scannedAt = scannedAt;
    }

    barcodeFoundInOdoo(): boolean {
        return undefined !== this.unit;
    }
}
