'use strict';

import Papa from 'papaparse';
import InventoryList from '../entities/Lists/InventoryList';
import AppLogger from './AppLogger';
import * as RNFS from 'react-native-fs';
import SupercoopSignIn from './SupercoopSignIn';
import InventoryEntry from '../entities/Lists/InventoryEntry';

export interface CSVData {
    [key: string]: string | number | boolean | null | undefined;
}

export default class CSVGenerator {
    DEFAULT_DIR: string;

    constructor() {
        this.DEFAULT_DIR = RNFS.TemporaryDirectoryPath + '/csv-generator';
    }

    async exportInventoryList(inventoryList: InventoryList, inventoryEntries: InventoryEntry[]): Promise<string> {
        const entriesArray: CSVData[] = [];

        const userFirstname = SupercoopSignIn.getInstance().getFirstnameSlug();
        const csvFilenameDateTime = inventoryList.lastModifiedAt && inventoryList.lastModifiedAt.toISO();
        const csvFilename = `Zone${inventoryList.zone}_${userFirstname}-${csvFilenameDateTime}.csv`;

        for (const key in inventoryEntries) {
            const entry = inventoryEntries[key];
            const articleBarcode = entry.productBarcode || '';
            const articleQuantity = entry.quantity;
            const articleName = entry.productName || '';
            entriesArray.push({
                Code: articleBarcode,
                Nb: articleQuantity,
                Name: articleName,
            });
        }

        return this.generateCSVFile(csvFilename, entriesArray);
    }

    public generateCSV(data: CSVData[]): string {
        return Papa.unparse(data, {
            quotes: true,
            quoteChar: '"',
            escapeChar: '"',
            delimiter: ',',
            header: true,
            newline: '\n',
            skipEmptyLines: 'greedy',
            columns: undefined,
        });
    }

    public async generateCSVFile(filename: string, data: CSVData[]): Promise<string> {
        const csv = this.generateCSV(data);
        AppLogger.getLogger().debug('Generated CSV:');
        AppLogger.getLogger().debug(csv);

        RNFS.mkdir(this.DEFAULT_DIR);
        const csvFilepath = this.DEFAULT_DIR + '/' + filename;

        await RNFS.writeFile(csvFilepath, csv);
        return csvFilepath;
    }
}
