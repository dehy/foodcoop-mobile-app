'use strict';

import deepmerge from 'deepmerge';
import BaseList, {ListType} from './BaseList';
import InventoryEntry from './InventoryEntry';

export default class InventoryList extends BaseList {
    public static icon = 'boxes';
    public static label = 'Inventaire';
    public static entryClass = InventoryEntry;

    static schema: Realm.ObjectSchema = deepmerge(BaseList.schema, {
        properties: {
            zone: 'string',
        },
    });

    public zone: string;

    constructor(name: string, zone: string) {
        super(ListType.Inventory, name);
        this.zone = zone;
    }

    entryWithBarcode(barcode: string): InventoryEntry | undefined {
        return this.entries?.find(entry => entry.barcode === barcode);
    }

    indexOfEntryWithBarcode(barcode?: string): number | undefined {
        return this.entries?.findIndex(entry => entry.barcode === barcode);
    }
}
