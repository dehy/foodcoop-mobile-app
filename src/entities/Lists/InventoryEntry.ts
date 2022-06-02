'use strict';

import deepmerge from 'deepmerge';
import BaseEntry from './BaseEntry';

export default class InventoryEntry extends BaseEntry {
    static schema: Realm.ObjectSchema = deepmerge(BaseEntry.schema, {
        properties: {
            newQuantity: 'float',
        },
    });

    public newQuantity?: number;

    constructor(name: string, barcode?: string, newQuantity?: number) {
        super(name, barcode);
        this.newQuantity = newQuantity;
    }
}
