'use strict'

import Papa from 'papaparse'
import InventoryEntry from '../entities/InventoryEntry'
import InventoryEntryFactory from '../factories/InventoryEntryFactory'

export default class CSVGenerator {
    constructor() {

    }

    async exportInventorySession(inventorySession) {
        const inventoryEntries = await InventoryEntryFactory.sharedInstance().findForInventorySession(inventorySession);
        const entriesArray = [["Code", "Nb", "Name"]];
        for (let key in inventoryEntries) {
            const entry = inventoryEntries[key];
            entriesArray.push([entry.articleBarcode, entry.articleQuantity, entry.articleName]);
        }

        return this.arrayToCsv(entriesArray);
    }

    arrayToCsv(data) {
        return Papa.unparse(data);
    }
}