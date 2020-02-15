'use strict';

import OdooApi from 'react-native-odoo-promise-based';
import ProductProduct from '../entities/Odoo/ProductProduct';
import ProductProductFactory from '../factories/Odoo/ProductProductFactory';
import CookieManager from 'react-native-cookies';
import { isInt } from './helpers';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';
import PurchaseOrderFactory from '../factories/Odoo/PurchaseOrderFactory';
import moment from 'moment';
import PurchaseOrderLine from '../entities/Odoo/PurchaseOrderLine';
import PurchaseOrderLineFactory from '../factories/Odoo/PurchaseOrderLineFactory';
import iconv from 'iconv-lite';

export default class Odoo {
    private static UNIT_UNIT = 1;
    private static UNIT_KG = 2;

    private static FETCH_FIELDS_PRODUCT = [
        'name',
        'barcode',
        'qty_available',
        'lst_price',
        'uom_id',
        'weight_net',
        'volume',
    ];

    public static DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

    private static instance: Odoo;
    private static odooEnpoint = '***REMOVED***';
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
            password: '***REMOVED***',
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
    //     // console.debug(response);
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
    //     // console.debug(response);
    //     if (response.data.length > 0) {
    //         return new ProductProduct(response.data[0]);
    //     }
    //     return null;
    // }

    resetApiAuthDetails(): void {
        this.isConnected = false;
        this.odooApi.sid = undefined;
        this.odooApi.cookie = undefined;
        // eslint-disable-next-line @typescript-eslint/camelcase
        this.odooApi.session_id = undefined;
    }

    assertApiResponse(response: OdooApiResponse): void {
        // console.debug('assertApiResponse()');
        // console.debug(response);
        CookieManager.get(Odoo.odooEnpoint).then(res => {
            // console.debug('CookieManager.get => ', res);
        });
        if (response.success == true) {
            return;
        }
        if (response.error.code == 100) {
            // "Odoo Session Expired"
            console.error(response);
            this.resetApiAuthDetails();
            throw new Error(response.error.message);
        }
    }

    async fetchPurchaseOrdersPlannedToday(): Promise<PurchaseOrder[]> {
        await this.assertConnect();

        const params = {
            domain: [
                ['state', '=', 'purchase'],
                [
                    'date_planned',
                    '>=',
                    moment()
                        .startOf('day')
                        .format(Odoo.DATETIME_FORMAT),
                ],
                [
                    'date_planned',
                    '<',
                    moment()
                        .endOf('day')
                        .format(Odoo.DATETIME_FORMAT),
                ],
            ],
            fields: ['id', 'name', 'partner_id', 'date_order', 'date_planned'],
            offset: 0,
            order: 'date_planned DESC',
        };
        const response = await this.odooApi.search_read('purchase.order', params);
        this.assertApiResponse(response);
        if (response.data.length > 0) {
            const purchaseOrders: PurchaseOrder[] = [];
            response.data.forEach((element: OdooApiPurchaseOrder) => {
                purchaseOrders.push(PurchaseOrderFactory.PurchaseOrderFromResponse(element));
            });
            return purchaseOrders;
        }
        return [];
    }

    async fetchWaitingPurchaseOrders(): Promise<PurchaseOrder[]> {
        await this.assertConnect();

        const params = {
            domain: [
                ['state', '=', 'purchase'],
                [
                    'date_planned',
                    '>',
                    moment()
                        .subtract(2, 'week')
                        .format(Odoo.DATETIME_FORMAT),
                ],
            ],
            fields: ['id', 'name', 'partner_id', 'date_order', 'date_planned'],
            //limit: 10,
            offset: 0,
            order: 'date_planned DESC',
        };

        const response = await this.odooApi.search_read('purchase.order', params);
        this.assertApiResponse(response);
        if (response.data.length > 0) {
            const purchaseOrders: PurchaseOrder[] = [];
            response.data.forEach((element: OdooApiPurchaseOrder) => {
                purchaseOrders.push(PurchaseOrderFactory.PurchaseOrderFromResponse(element));
            });
            return purchaseOrders;
        }
        return [];
    }

    async fetchPurchaseOrderFromName(poName: string): Promise<PurchaseOrder | undefined> {
        await this.assertConnect();

        const params = {
            domain: [['name', '=', poName]],
            //fields: ['name', 'barcode', 'qty_available', 'lst_price', 'uom_id', 'weight_net', 'volume'],
            limit: 1,
            offset: 0,
        };

        const response = await this.odooApi.search_read('purchase.order', params);
        this.assertApiResponse(response);
        if (response.data.length > 0) {
            return PurchaseOrderFactory.PurchaseOrderFromResponse(response.data[0]);
        }
        return undefined;
    }

    async fetchPurchaseOrderLinesForPurchaseOrder(purchaseOrder: PurchaseOrder): Promise<PurchaseOrderLine[]> {
        await this.assertConnect();

        if (purchaseOrder.id == null) {
            return [];
        }

        const params = {
            domain: [['order_id', '=', purchaseOrder.id]],
            fields: ['id', 'name', 'product_id', 'package_qty', 'product_qty_package', 'product_qty', 'product_uom'],
            offset: 0,
        };

        const response = await this.odooApi.search_read('purchase.order.line', params);
        this.assertApiResponse(response);
        //console.log('fetchPurchaseOrderLinesForPurchaseOrder');
        if (response.data.length > 0) {
            const purchaseOrderLines: PurchaseOrderLine[] = [];
            response.data.forEach((element: OdooApiPurchaseOrderLine) => {
                const purchaseOrderLine = PurchaseOrderLineFactory.PurchaseOrderLineFromResponse(element);
                purchaseOrderLine.purchaseOrder = purchaseOrder;

                purchaseOrderLines.push(purchaseOrderLine);
            });
            purchaseOrder.purchaseOrderLines = purchaseOrderLines;
            return purchaseOrderLines;
        }
        return [];
    }

    async fetchProductFromIds(ids: number[]): Promise<ProductProduct[] | undefined> {
        // console.debug('[Odoo] fetchProductFromIds()');
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(this.odooApi);
            throw new Error('Odoo is not connected');
        }

        const params = {
            ids: ids,
            fields: Odoo.FETCH_FIELDS_PRODUCT,
        }; //params

        // console.debug('[Odoo] search_read(product.product) with params:');
        // console.debug(params);
        const response = await this.odooApi.get('product.product', params);
        this.assertApiResponse(response);
        const products: ProductProduct[] = [];
        if (response.data.length > 0) {
            response.data.forEach((element: OdooApiProductProduct) => {
                products.push(ProductProductFactory.ProductProductFromResponse(element));
            });
            return products;
        }
        return undefined;
    }

    async fetchProductFromBarcode(barcode: string): Promise<ProductProduct | null> {
        // console.debug('[Odoo] fetchProductFromBarcode()');
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(this.odooApi);
            throw new Error('Odoo is not connected');
        }

        const params = {
            // ids: [1, 2, 3, 4, 5],
            // domain: [['list_price', '>', '50'], ['list_price', '<', '65']],
            domain: [['barcode', '=', barcode]],
            fields: Odoo.FETCH_FIELDS_PRODUCT,
            // lst_price = prix de vente, standard_price = achat, uom_id = unité de vente, uom_po_id = unité d'achat
            // order: 'name DESC',
            limit: 1,
            offset: 0,
        }; //params

        // console.debug('[Odoo] search_read(product.product) with params:');
        // console.debug(params);
        const response = await this.odooApi.search_read('product.product', params);
        this.assertApiResponse(response);
        if (response.data.length > 0) {
            return ProductProductFactory.ProductProductFromResponse(response.data[0]);
        }
        return null;
    }

    async fetchImageForProductProduct(odooProduct: ProductProduct): Promise<string | null> {
        // console.debug('fetchImageForProductProduct()');
        if ((await this.assertConnect()) !== true) {
            throw new Error('Odoo is not connected');
        }

        const params = {
            domain: [['barcode', '=', odooProduct.barcode]],
            fields: ['image'],
            limit: 1,
            offset: 0,
        };

        const response = await this.odooApi.search_read('product.product', params);
        this.assertApiResponse(response);

        return response.data.length > 0 ? response.data[0].image : null;
    }

    assertConnect = async (): Promise<boolean> => {
        // console.debug('[Odoo] assertConnect()');
        return new Promise<boolean>((resolve, reject) => {
            if (!this.isConnected) {
                // console.debug('[Odoo] not connected, connecting...');
                this.odooApi
                    .connect()
                    .then(response => {
                        this.assertApiResponse(response);
                        if (isInt(response.data.uid) && response.data.uid > 0) {
                            // console.debug('[Odoo] connection ok');
                            // // console.debug(context.odooApi);
                            this.isConnected = true;
                            resolve(true);
                        } else {
                            // console.debug('[Odoo] connection ko');
                            this.isConnected = false;
                            console.error(response);
                            reject(false);
                        }
                    })
                    .catch(reason => {
                        // console.debug('[Odoo] odoo connect failed');
                        reject(reason);
                    });
            } else {
                // console.debug('[Odoo] alreay connected');
                resolve(true);
            }
        }).catch(e => {
            console.error(e);
            return false;
        });
    };

    iso88591ToUtf8(data: string): string {
        return iconv.decode(Buffer.from(data), 'iso-8859-1');
    }
}
