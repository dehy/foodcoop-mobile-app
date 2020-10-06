'use strict';

import Papa from 'papaparse';
import InventoryEntryFactory from '../factories/InventoryEntryFactory';
import InventorySession from '../entities/InventorySession';
import AppLogger from './AppLogger';
import * as RNFS from 'react-native-fs';
import SupercoopSignIn from './SupercoopSignIn';

export interface CSVData {
    [key: string]: string | number | boolean | null | undefined;
}

export default class CSVGenerator {
    DEFAULT_DIR: string;

    constructor() {
        this.DEFAULT_DIR = RNFS.TemporaryDirectoryPath + '/csv-generator';
    }

    async exportInventorySession(inventorySession: InventorySession): Promise<string> {
        const inventoryEntries = await InventoryEntryFactory.sharedInstance().findForInventorySession(inventorySession);
        const entriesArray: CSVData[] = [];

        const userFirstname = SupercoopSignIn.getInstance().getFirstnameSlug();
        const csvFilenameDateTime =
            inventorySession.lastModifiedAt && inventorySession.lastModifiedAt.format('YYYYMMDDHHmmss');
        const csvFilename = `Zone${inventorySession.zone}_${userFirstname}-${csvFilenameDateTime}.csv`;

        for (const key in inventoryEntries) {
            const entry = inventoryEntries[key];
            const articleBarcode = entry.articleBarcode || '';
            const articleQuantity = entry.articleQuantity ? entry.articleQuantity.toString() : '';
            const articleName = entry.articleName || '';
            entriesArray.push({
                Code: articleBarcode,
                Nb: articleQuantity,
                Name: articleName,
            });
        }

        return await this.generateCSVFile(csvFilename, entriesArray);
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
