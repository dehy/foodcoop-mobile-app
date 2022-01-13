'use strict';

import OdooApi from 'react-native-odoo-promise-based';
import ProductProduct from '../entities/Odoo/ProductProduct';
import ProductProductFactory from '../factories/Odoo/ProductProductFactory';
import CookieManager from '@react-native-cookies/cookies';
import {isInt, replaceStringAt, round} from './helpers';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';
import PurchaseOrderFactory from '../factories/Odoo/PurchaseOrderFactory';
import moment from 'moment';
import PurchaseOrderLine from '../entities/Odoo/PurchaseOrderLine';
import PurchaseOrderLineFactory from '../factories/Odoo/PurchaseOrderLineFactory';
import iconv from 'iconv-lite';
import Dates from './Dates';
import Config from 'react-native-config';

interface BarcodeRule {
    name: string;
    encoding: string;
    type: string;
    pattern: string;
    regex?: RegExp;
    sequence: number;
}

export interface ParsedBarcode {
    original: string;
    base?: string;
    weight?: number;
    price?: number;
}

export default class Odoo {
    private static FETCH_FIELDS_PRODUCT = [
        'name',
        'barcode',
        'qty_available',
        'lst_price',
        'uom_id',
        'weight_net',
        'volume',
        'product_tmpl_id',
    ];

    private static instance: Odoo;
    private static odooEndpoint = Config.ODOO_ENDPOINT;
    private static barcodeRules: BarcodeRule[] = [];
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
            host: Odoo.odooEndpoint,
            port: Config.ODOO_PORT,
            protocol: Config.ODOO_SCHEME,
            username: Config.ODOO_USERNAME,
            password: Config.ODOO_PASSWORD,
            database: Config.ODOO_DATABASE,
        });
    }

    resetApiAuthDetails(): void {
        this.isConnected = false;
        this.odooApi.sid = undefined;
        this.odooApi.cookie = undefined;
        // eslint-disable-next-line @typescript-eslint/camelcase
        this.odooApi.session_id = undefined;
    }

    assertApiResponse(response: OdooApiResponse): void {
        console.debug('assertApiResponse()');
        console.debug(response);
        CookieManager.get(Odoo.odooEndpoint);
        if (response.success) {
            return;
        }
        if (response.error.code == 100) {
            // "Odoo Session Expired"
            this.resetApiAuthDetails();
            console.error(JSON.stringify(response));
            throw new Error(JSON.stringify(response));
        }
        throw new Error(JSON.stringify(response));
    }

    async fetchBarcodeNomenclature(): Promise<void> {
        await this.assertConnect();
        const params = {
            domain: [['barcode_nomenclature_id', '=', 2]],
            fields: ['sequence', 'pattern', 'name', 'encoding', 'type'],
            offset: 0,
            order: 'sequence ASC',
        };
        const response = await this.odooApi.search_read('barcode.rule', params);

        this.assertApiResponse(response);
        if (response.data && response.data.length > 0) {
            const rules = response.data as BarcodeRule[];
            for (const rule of rules) {
                let regexString = rule.pattern;
                regexString = regexString.replace(/[\{\}]/g, '');
                regexString = regexString.replace(/[ND]/g, '.');
                rule.regex = new RegExp(`^${regexString}$`);
            }
            console.debug(rules);
            Odoo.barcodeRules = rules;
        }
    }

    static barcodeRuleForBarcode(barcode: string): BarcodeRule | undefined {
        console.debug(`barcode: ${barcode}`);
        const barcodeWoChecksum = barcode.slice(0, barcode.length - 1);
        console.debug(`barcode without checksum: ${barcodeWoChecksum}`);
        let barcodeEncoding;
        switch (barcode.length) {
            case 8:
                barcodeEncoding = 'ean8';
                break;
            case 13:
                barcodeEncoding = 'ean13';
                break;
            default:
                barcodeEncoding = 'any';
        }
        console.debug(`barcode encoding: ${barcodeEncoding}`);
        for (const barcodeRule of Odoo.barcodeRules) {
            console.debug(`Trying barcode rule: ${barcodeRule.pattern}`);
            if (barcodeEncoding !== barcodeRule.encoding) {
                // skip if not the same encoding rule
                console.debug(`+ encoding not matching (${barcodeEncoding} != ${barcodeRule.encoding})`);
                continue;
            }
            if (barcodeRule.regex) {
                console.debug(`barcode regex: ${barcodeRule.regex}`);
                const barcodeToTest = 'any' === barcodeEncoding ? barcode : barcodeWoChecksum;
                if (null !== barcodeRule.regex.exec(barcodeToTest)) {
                    // we have a match!
                    console.debug(`+ It's a match! ${barcodeRule.name}`);
                    return barcodeRule;
                } else {
                    console.debug("+ Encoding matching but regex don't");
                    console.debug(`Regex: ${barcodeRule.regex}`);
                    console.debug(`Barcode: ${barcodeToTest}`);
                    console.debug(`Result: ${barcodeRule.regex.exec(barcodeToTest)}`);
                }
            }
        }
        return undefined;
    }

    static eanCheckDigit(s: string): string {
        let result = 0;
        for (let counter = s.length - 1; counter >= 0; counter--) {
            result = result + parseInt(s.charAt(counter)) * (1 + 2 * (counter % 2));
        }
        return ((10 - (result % 10)) % 10).toString();
    }

    static barcodeIsValid(barcode: string): boolean {
        const providedChecksumDigit = barcode.slice(barcode.length - 1, barcode.length);
        const calculatedChecksumDigit = Odoo.eanCheckDigit(barcode.slice(0, barcode.length - 1));
        if (calculatedChecksumDigit === providedChecksumDigit) {
            return true;
        }
        return false;
    }

    static parseBarcode(barcode: string): ParsedBarcode {
        const parsedBarcode: ParsedBarcode = {
            original: barcode,
            base: undefined,
            weight: undefined,
            price: undefined,
        };
        let baseBarcode: string = JSON.parse(JSON.stringify(barcode));
        const rule = Odoo.barcodeRuleForBarcode(barcode);
        if (!rule) {
            return parsedBarcode;
        }
        if ('weight' !== rule.type && 'price' !== rule.type) {
            return parsedBarcode;
        }
        const pattern = rule.pattern.replace(/[\{\}]/g, '');
        const unitsResult = new RegExp(/N+/g).exec(pattern);
        if (null === unitsResult) {
            return parsedBarcode;
        }
        const unitsPositionStart = unitsResult?.index;
        const unitsSize = unitsResult[0].length;
        if (undefined === unitsPositionStart || unitsSize === 0) {
            return parsedBarcode;
        }
        const units = barcode.slice(unitsPositionStart, unitsPositionStart + unitsSize);
        baseBarcode = replaceStringAt(baseBarcode, unitsPositionStart, '0'.repeat(unitsSize));

        const decimalsResult = new RegExp(/D+/g).exec(pattern);
        let decimalsSize = 0;
        let decimals = '0';
        if (null !== decimalsResult) {
            const decimalsPositionStart = decimalsResult?.index;
            decimalsSize = decimalsResult[0].length;
            decimals = barcode.slice(decimalsPositionStart, decimalsPositionStart + decimalsSize);
            baseBarcode = replaceStringAt(baseBarcode, decimalsPositionStart, '0'.repeat(decimalsSize));
        }

        if ('weight' === rule.type) {
            parsedBarcode.weight = parseInt(units) + parseInt(decimals) / Math.pow(10, decimalsSize);
        }
        if ('price' === rule.type) {
            parsedBarcode.price = parseInt(units) + parseInt(decimals) / Math.pow(10, decimalsSize);
        }

        // Recalculate the checksum digit for the base barcode
        const newChecksumDigit = Odoo.eanCheckDigit(baseBarcode.slice(0, baseBarcode.length - 1));
        baseBarcode = replaceStringAt(baseBarcode, baseBarcode.length - 1, newChecksumDigit);
        parsedBarcode.base = baseBarcode;

        console.debug(`parsedBarcode: ${JSON.stringify(parsedBarcode)}`);

        return parsedBarcode;
    }

    async fetchPurchaseOrdersPlannedToday(): Promise<PurchaseOrder[]> {
        await this.assertConnect();

        const params = {
            domain: [
                ['state', '=', 'purchase'],
                ['date_planned', '>=', moment().startOf('day').format(Dates.ODOO_DATETIME_FORMAT)],
                ['date_planned', '<', moment().endOf('day').format(Dates.ODOO_DATETIME_FORMAT)],
            ],
            fields: ['id', 'name', 'partner_id', 'date_order', 'date_planned'],
            offset: 0,
            order: 'date_planned DESC',
        };
        const response = await this.odooApi.search_read('purchase.order', params);
        this.assertApiResponse(response);
        if (response.data && response.data.length > 0) {
            const purchaseOrders: PurchaseOrder[] = [];
            response.data.forEach((element: OdooApiPurchaseOrder) => {
                purchaseOrders.push(PurchaseOrderFactory.PurchaseOrderFromResponse(element));
            });
            return purchaseOrders;
        }
        return [];
    }

    async fetchWaitingPurchaseOrders(page = 1): Promise<PurchaseOrder[]> {
        await this.assertConnect();

        const params = {
            domain: [['state', '=', 'purchase']],
            fields: ['id', 'name', 'partner_id', 'date_order', 'date_planned'],
            limit: 20,
            offset: 20 * (page - 1),
            order: 'date_planned DESC',
        };

        const response = await this.odooApi.search_read('purchase.order', params);
        this.assertApiResponse(response);
        if (response.data && response.data.length > 0) {
            const purchaseOrders: PurchaseOrder[] = [];
            response.data.forEach((element: OdooApiPurchaseOrder) => {
                purchaseOrders.push(PurchaseOrderFactory.PurchaseOrderFromResponse(element));
            });
            return purchaseOrders;
        }
        return [];
    }

    async fetchProductSupplierInfoFromProductTemplateIds(
        productTemplateIds: number[],
        partnerId: number,
    ): Promise<{[id: number]: string} | undefined> {
        await this.assertConnect();

        const params = {
            domain: [
                ['product_tmpl_id.id', '=', productTemplateIds],
                ['name', '=', partnerId],
            ],
            fields: ['product_tmpl_id', 'product_name', 'product_code'],
            offset: 0,
        };

        const response = await this.odooApi.search_read('product.supplierinfo', params);
        this.assertApiResponse(response);

        const mapSupplierCode: {[productId: number]: string} = {};
        if (response.data && response.data.length > 0) {
            response.data.forEach((entry: OdooApiProductSupplierInfo) => {
                if (entry.product_tmpl_id) {
                    mapSupplierCode[entry.product_tmpl_id[0]] = entry.product_code ? entry.product_code : '';
                }
            });
            return mapSupplierCode;
        }
        return undefined;
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
        if (response.data && response.data.length > 0) {
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
        console.debug('fetchPurchaseOrderLinesForPurchaseOrder');
        if (response.data && response.data.length > 0) {
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
        console.debug('[Odoo] fetchProductFromIds()');
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(this.odooApi);
            throw new Error('Odoo is not connected');
        }

        const params = {
            ids: ids,
            fields: Odoo.FETCH_FIELDS_PRODUCT,
        }; //params

        console.debug('[Odoo] search_read(product.product) with params:');
        console.debug(params);
        const response = await this.odooApi.get('product.product', params);
        this.assertApiResponse(response);
        const products: ProductProduct[] = [];
        if (response.data && response.data.length > 0) {
            response.data.forEach((element: OdooApiProductProduct) => {
                products.push(ProductProductFactory.ProductProductFromResponse(element));
            });
            return products;
        }
        return undefined;
    }

    async fetchProductFromBarcode(barcode: string): Promise<ProductProduct | null> {
        console.debug('[Odoo] fetchProductFromBarcode()');
        const isConnected = await this.assertConnect();
        if (isConnected !== true) {
            console.error(this.odooApi);
            throw new Error('Odoo is not connected');
        }

        const parsedBarcode = Odoo.parseBarcode(barcode);
        const odooBarcode = parsedBarcode.base ?? parsedBarcode.original;

        const params = {
            // ids: [1, 2, 3, 4, 5],
            // domain: [['list_price', '>', '50'], ['list_price', '<', '65']],
            domain: [['barcode', '=', odooBarcode]],
            fields: Odoo.FETCH_FIELDS_PRODUCT,
            // lst_price = prix de vente, standard_price = achat, uom_id = unité de vente, uom_po_id = unité d'achat
            // order: 'name DESC',
            limit: 1,
            offset: 0,
        }; //params

        console.debug('[Odoo] search_read(product.product) with params:');
        console.debug(params);
        const response = await this.odooApi.search_read('product.product', params);
        this.assertApiResponse(response);
        if (response.data && response.data.length > 0) {
            const product = ProductProductFactory.ProductProductFromResponse(response.data[0]);
            if (parsedBarcode.weight && product.weightNet && product.lstPrice) {
                const ratio = parsedBarcode.weight / product.weightNet;
                product.weightNet = parsedBarcode.weight;
                product.lstPrice = round(product.lstPrice * ratio, 2);
            }
            if (parsedBarcode.price && product.lstPrice && product.weightNet) {
                const ratio = parsedBarcode.price / product.lstPrice;
                product.lstPrice = parsedBarcode.price;
                product.weightNet = round(product.weightNet * ratio, 3);
            }
            return product;
        }
        return null;
    }

    async fetchImageForProductProduct(odooProduct: ProductProduct): Promise<string | null> {
        console.debug('fetchImageForProductProduct()');
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

        return response.data && response.data.length > 0 ? response.data[0].image : null;
    }

    assertConnect = async (): Promise<boolean> => {
        console.debug('[Odoo] assertConnect()');
        return new Promise<boolean>((resolve, reject) => {
            if (!this.isConnected) {
                console.debug('[Odoo] not connected, connecting...');
                this.odooApi
                    .connect()
                    .then(response => {
                        this.assertApiResponse(response);
                        if (response.data && isInt(response.data.uid) && response.data.uid > 0) {
                            console.debug('[Odoo] connection ok');
                            this.isConnected = true;
                            resolve(true);
                        } else {
                            console.error('[Odoo] connection ko');
                            this.isConnected = false;
                            console.error(response);
                            reject(false);
                        }
                    })
                    .catch(reason => {
                        console.error('[Odoo] odoo connect failed');
                        reject(reason);
                    });
            } else {
                console.debug('[Odoo] already connected');
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
