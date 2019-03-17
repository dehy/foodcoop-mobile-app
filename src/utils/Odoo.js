'use strict'

import OdooApi from 'react-native-odoo-promise-based';
import OdooProduct from '../entities/OdooProduct';
import CookieManager from 'react-native-cookies';

export default class Odoo {

    static UNIT_UNIT = 1;
    static UNIT_KG = 2;

    static instance = null;
    static odooEnpoint = 'labo.supercoop.fr';

    static getInstance() {
        if (Odoo.instance == null) {
            Odoo.instance = new Odoo();
        }

        return this.instance;
    }

    constructor() {
        this.isConnected = false;

        this.odooApi = new OdooApi({
            host: Odoo.odooEnpoint,
            port: 443,
            protocol: 'https',
            database: 'PROD',
            username: '***REMOVED***',
            password: '***REMOVED***'
        });
    }

    // async fetchBarcodeRules() {
    //     await this.assertConnect();
    //     var params = {

    //     }

    //     const response = await this.odooApi.search_read('barcode.rule', params);
    //     if (response.success !== true) {
    //         console.error(response);
    //     }
    //     console.debug(response);
    // }

    // async fetchProductFromBarcodeBase(barcodeBase, barcodeRuleId) {
    //     console.log("fetchProductFromBarcode");
    //     const isConnected = await this.assertConnect();
    //     if (isConnected !== true) {
    //         console.error(odooApi);
    //         throw new Error("Odoo is not connected");
    //     }

    //     var params = {
    //         // ids: [1, 2, 3, 4, 5],
    //         // domain: [['list_price', '>', '50'], ['list_price', '<', '65']],
    //         domain: [['barcode_rule_id', '=', barcodeRuleId], ['barcode_base', '=', barcodeBase]],
    //         fields: ['name', 'barcode', 'qty_available', 'lst_price', 'uom_id', 'weight_net', 'volume'],
    //         // lst_price = prix de vente, standard_price = achat, uom_id = unité de vente, uom_po_id = unité d'achat
    //         // order: 'name DESC',
    //         limit: 1,
    //         offset: 0,
    //     }; //params

    //     const response = await this.odooApi.search_read('product.product', params);
    //     if (response.success !== true) {
    //         console.error(response);
    //     }
    //     console.debug(response);
    //     if (response.data.length > 0) {
    //         return new OdooProduct(response.data[0]);
    //     }
    //     return null;
    // }

    resetApiAuthDetails() {
        this.isConnected = false;
        this.odooApi.sid = null;
        this.odooApi.cookie = null;
        this.odooApi.session_id = null;
    }

    assertApiResponse(response) {
        console.debug("assertApiResponse()");
        console.debug(response);
        CookieManager.get(Odoo.odooEnpoint).then((res) => {
            console.debug("CookieManager.get => ", res);
        });
        if (response.success == true) {
            return;
        }
        if (response.error.code == 100) { // "Odoo Session Expired"
            console.error(response);
            this.resetApiAuthDetails();
            throw new Error(response.error.message);
        }
    }

    async fetchProductFromBarcode(barcode) {
        console.debug("[Odoo] fetchProductFromBarcode()");
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(odooApi);
            throw new Error("Odoo is not connected");
        }

        var params = {
            // ids: [1, 2, 3, 4, 5],
            // domain: [['list_price', '>', '50'], ['list_price', '<', '65']],
            domain: [['barcode', '=', barcode]],
            fields: ['name', 'barcode', 'qty_available', 'lst_price', 'uom_id', 'weight_net', 'volume'],
            // lst_price = prix de vente, standard_price = achat, uom_id = unité de vente, uom_po_id = unité d'achat
            // order: 'name DESC',
            limit: 1,
            offset: 0,
        }; //params

        console.debug("[Odoo] search_read(product.product) with params:");
        console.debug(params);
        const response = await this.odooApi.search_read('product.product', params);
        this.assertApiResponse(response);
        if (response.data.length > 0) {
            return new OdooProduct(response.data[0]);
        }
        return null;
    }

    async fetchImageForOdooProduct(odooProduct) {
        console.debug("fetchImageForOdooProduct()");
        if (await this.assertConnect() !== true) {
            throw new Error("Odoo is not connected");
        }

        var params = {
            domain: [['barcode', '=', odooProduct.barcode]],
            fields: ['image'],
            limit: 1,
            offset: 0
        }

        const response = await this.odooApi.search_read('product.product', params);
        this.assertApiResponse(response);

        return response.data.length > 0 ? response.data[0].image : null;
    }

    async assertConnect() {
        console.debug("[Odoo] assertConnect()");
        var context = this;
        return new Promise(function (resolve, reject) {
            if (!context.isConnected) {
                console.debug("[Odoo] not connected, connecting...");
                context.odooApi.connect().then((response) => {
                    context.assertApiResponse(response);
                    if (Number.isInteger(response.data.uid) && response.data.uid > 0) {
                        console.debug("[Odoo] connection ok");
                        // console.debug(context.odooApi);
                        context.isConnected = true;
                        resolve(true);
                    } else {
                        console.debug("[Odoo] connection ko");
                        context.isConnected = false;
                        console.error(response);
                        reject(false);
                    }
                }).catch((reason) => {
                    console.debug("[Odoo] odoo connect failed");
                    reject(reason);
                });
            } else {
                console.debug("[Odoo] alreay connected");
                resolve(true);
            }
        }).catch((e) => {
            console.error(e);
        });
    }
}