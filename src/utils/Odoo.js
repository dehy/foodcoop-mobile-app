'use strict'

import OdooApi from 'react-native-odoo-promise-based';
import Article from '../entities/Article';

export default class Odoo {

    static UNIT_UNIT = 1;
    static UNIT_KG = 2;

    constructor() {
        this.isConnected = false;

        this.odooApi = new OdooApi({
            host: 'labo.test.supercoop.fr',
            port: 443,
            protocol: 'https',
            database: 'PROD',
            username: 'fjg@supercoop.fr',
            password: 'Supercoop18'
        });
    }

    async fetchArticleFromBarcode(barcode) {
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(odooApi);
            throw new Error("Odoo is not connected");
        }
    
        var params = {
            // ids: [1, 2, 3, 4, 5],
            // domain: [['list_price', '>', '50'], ['list_price', '<', '65']],
            domain: [['barcode', '=', barcode]],
            fields: ['name', 'barcode', 'qty_available', 'lst_price', 'uom_id', 'standard_price', 'uom_po_id'],
            // lst_price = prix de vente, standard_price = achat, uom_id = unité de vente, uom_po_id = unité d'achat
            order: 'name DESC',
            limit: 50,
            offset: 0,
        }; //params
    
        const response = await this.odooApi.search_read('product.product', params);
        if (response.success !== true) {
            console.error(response);
        }
        return new Article(response.data[0]);
    }

    async assertConnect() {
        console.log("assertConnect");
        var context = this;
        return new Promise(function (resolve, reject) {
            if (!context.isConnected) {
                console.log("not connected");
                context.odooApi.connect().then((response) => {
                    if (Number.isInteger(response.data.uid) && response.data.uid > 0) {
                        context.isConnected = true;
                        resolve(true);
                    } else {
                        context.isConnected = false;
                        reject(false);
                    }
                }).catch((reason) => {
                    reject(reason);
                });
            } else {
                resolve(true);
            }
        }).catch((e) => {
            console.error(e);
        });
    }
}