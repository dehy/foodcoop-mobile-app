'use strict';

import Papa from 'papaparse';
import InventoryEntryFactory from '../factories/InventoryEntryFactory';
import InventorySession from '../entities/InventorySession';

export default class CSVGenerator {
    async exportInventorySession(inventorySession: InventorySession): Promise<string> {
        const inventoryEntries = await InventoryEntryFactory.sharedInstance().findForInventorySession(inventorySession);
        const entriesArray = [['Code', 'Nb', 'Name']];
        for (const key in inventoryEntries) {
            const entry = inventoryEntries[key];
            const articleBarcode = entry.articleBarcode ? entry.articleBarcode : '';
            const articleQuantity = entry.articleQuantity ? entry.articleQuantity.toString() : '';
            const articleName = entry.articleName ? entry.articleName : '';
            entriesArray.push([articleBarcode, articleQuantity, articleName]);
        }

        return this.arrayToCsv(entriesArray);
    }

    arrayToCsv(data: string[][]): string {
        return Papa.unparse(data, {
            quotes: true,
        });
    }
}
