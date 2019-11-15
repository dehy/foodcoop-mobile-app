'use strict'

import OdooApi from 'react-native-odoo-promise-based';
import ProductProduct from '../entities/Odoo/ProductProduct';
import ProductProductFactory from '../factories/Odoo/ProductProductFactory';
import CookieManager from 'react-native-cookies';
import { isInt } from './helpers';

export default class Odoo {

    private static UNIT_UNIT = 1;
    private static UNIT_KG = 2;

    private static instance: Odoo;
    private static odooEnpoint: string = 'labo.supercoop.fr';
    private isConnected: boolean;
    private odooApi: OdooApi;

    static getInstance(): Odoo {
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
    //         return new ProductProduct(response.data[0]);
    //     }
    //     return null;
    // }

    resetApiAuthDetails(): void {
        this.isConnected = false;
        this.odooApi.sid = undefined;
        this.odooApi.cookie = undefined;
        this.odooApi.session_id = undefined;
    }

    assertApiResponse(response: OdooApiResponse): void {
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

    async fetchProductFromBarcode(barcode: string): Promise<ProductProduct|undefined> {
        console.debug("[Odoo] fetchProductFromBarcode()");
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(this.odooApi);
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
            return ProductProductFactory.ProductProductFromResponse(response.data[0]);
        }
        return undefined;
    }

    async fetchImageForProductProduct(ProductProduct: ProductProduct) {
        console.debug("fetchImageForProductProduct()");
        if (await this.assertConnect() !== true) {
            throw new Error("Odoo is not connected");
        }

        var params = {
            domain: [['barcode', '=', ProductProduct.barcode]],
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
                    if (isInt(response.data.uid) && response.data.uid > 0) {
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