'use strict';

import OdooApi, {Response as OdooApiResponse} from 'react-native-odoo-jwt';
import ProductProduct from '../entities/Odoo/ProductProduct';
import ProductProductFactory from '../factories/Odoo/ProductProductFactory';
import {replaceStringAt, round} from './helpers';
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

interface OdooApiProductProduct {
    id?: number;
    product_tmpl_id?: [number, string];
    barcode?: string;
    name?: string;
    image?: string | null;
    qty_available?: number;
    uom_id?: [number, string];
    lst_price?: number;
    weight_net?: number;
    volume?: number;
}

interface OdooApiProductSupplierInfo {
    id?: number;
    name?: [number, string];
    product_tmpl_id?: [number, string];
    product_name?: string;
    product_code?: string;
}

interface OdooApiPurchaseOrder {
    id?: number;
    name?: string;
    date_order?: string;
    date_planned?: string;
    partner_id?: [number, string];
}

interface OdooApiPurchaseOrderLine {
    id?: number;
    name?: string;
    product_id?: [number, string];
    package_qty?: number;
    product_qty_package?: number;
    product_qty?: number;
    product_uom?: [number, string];
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
    private static barcodeRules: BarcodeRule[] = [];
    private odooApi: OdooApi;

    static getInstance(): Odoo {
        if (Odoo.instance == null) {
            Odoo.instance = new Odoo();
        }

        return this.instance;
    }

    constructor() {
        console.debug('ENDPOINT:', Config.ODOO_ENDPOINT!);
        this.odooApi = new OdooApi({
            endpoint: new URL(Config.ODOO_ENDPOINT!),
        });
    }

    setToken = (token: string | undefined) => {
        this.odooApi.setToken(token);
    };

    assertApiResponse(response: OdooApiResponse): void {
        //console.debug('assertApiResponse()');
        //console.debug(response);
        if (response.success) {
            return;
        }
        throw new Error(JSON.stringify(response));
    }

    async fetchBarcodeNomenclature(): Promise<void> {
        const params = {
            domain: [['barcode_nomenclature_id', '=', 2]],
            fields: ['sequence', 'pattern', 'name', 'encoding', 'type'],
            offset: 0,
            order: 'sequence ASC',
        };
        const response = await this.odooApi.search_read('barcode.rule', params);
        console.log(JSON.stringify(response));

        this.assertApiResponse(response);
        if (response.data && response.data.length > 0) {
            const rules = response.data as BarcodeRule[];
            for (const rule of rules) {
                let regexString = rule.pattern;
                regexString = regexString.replace(/[{}]/g, '');
                regexString = regexString.replace(/[ND]/g, '.');
                rule.regex = new RegExp(`^${regexString}$`);
            }
            Odoo.barcodeRules = rules;
        }
    }

    static barcodeRuleForBarcode(barcode: string): BarcodeRule | undefined {
        //console.debug(`barcode: ${barcode}`);
        const barcodeWoChecksum = barcode.slice(0, barcode.length - 1);
        //console.debug(`barcode without checksum: ${barcodeWoChecksum}`);
        let barcodeEncoding;
        switch (barcode.length) {
            case 8:
                barcodeEncoding = 'ean8';
                break;
            case 13:
            default:
                barcodeEncoding = 'ean13';
                break;
        }
        //console.debug(`barcode encoding: ${barcodeEncoding}`);
        for (const barcodeRule of Odoo.barcodeRules) {
            //console.debug(`Trying barcode rule: ${barcodeRule.pattern}`);
            if (barcodeEncoding !== barcodeRule.encoding) {
                // skip if not the same encoding rule
                // console.log(`+ encoding not matching`);
                continue;
            }
            if (barcodeRule.regex) {
                //console.debug(`barcode regex: ${barcodeRule.regex}`);
                if (barcodeRule.regex.exec(barcodeWoChecksum) !== null) {
                    // we have a match!
                    //console.debug(barcodeRule);
                    return barcodeRule;
                }
            }
        }
        return undefined;
    }

    static eanCheckDigit(s: string): string {
        let result = 0;
        for (let counter = s.length - 1; counter >= 0; counter--) {
            result = result + parseInt(s.charAt(counter), 10) * (1 + 2 * (counter % 2));
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
        if (rule.type !== 'weight' && rule.type !== 'price') {
            return parsedBarcode;
        }
        const pattern = rule.pattern.replace(/[{}]/g, '');
        const unitsResult = new RegExp(/N+/g).exec(pattern);
        if (unitsResult === null) {
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
        if (decimalsResult !== null) {
            const decimalsPositionStart = decimalsResult?.index;
            decimalsSize = decimalsResult[0].length;
            decimals = barcode.slice(decimalsPositionStart, decimalsPositionStart + decimalsSize);
            baseBarcode = replaceStringAt(baseBarcode, decimalsPositionStart, '0'.repeat(decimalsSize));
        }

        if (rule.type === 'weight') {
            parsedBarcode.weight = parseInt(units, 10) + parseInt(decimals, 10) / Math.pow(10, decimalsSize);
        }
        if (rule.type === 'price') {
            parsedBarcode.price = parseInt(units, 10) + parseInt(decimals, 10) / Math.pow(10, decimalsSize);
        }

        // Recalculate the checksum digit for the base barcode
        const newChecksumDigit = Odoo.eanCheckDigit(baseBarcode.slice(0, baseBarcode.length - 1));
        baseBarcode = replaceStringAt(baseBarcode, baseBarcode.length - 1, newChecksumDigit);
        parsedBarcode.base = baseBarcode;

        //console.debug(`parsedBarcode: ${JSON.stringify(parsedBarcode)}`);

        return parsedBarcode;
    }

    async fetchPurchaseOrdersPlannedToday(): Promise<PurchaseOrder[]> {
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
        //console.debug('fetchPurchaseOrderLinesForPurchaseOrder');
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
        //console.debug('[Odoo] fetchProductFromIds()');
        const params = {
            ids: ids,
            fields: Odoo.FETCH_FIELDS_PRODUCT,
        }; //params

        //console.debug('[Odoo] search_read(product.product) with params:');
        //console.debug(params);
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

    async fetchProductFromBarcode(barcode: string): Promise<ProductProduct> {
        console.debug('[Odoo] fetchProductFromBarcode()');
        const parsedBarcode = Odoo.parseBarcode(barcode);
        const odooBarcode = parsedBarcode.base ?? parsedBarcode.original;

        console.debug(`Parsed barcode: ${parsedBarcode}`);

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
        console.debug(response);
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

        throw new Error('Product not found');
    }

    async fetchImageForProductProduct(odooProduct: ProductProduct): Promise<string | null> {
        if (odooProduct.barcode === undefined) {
            return null;
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

    iso88591ToUtf8(data: string): string {
        return iconv.decode(Buffer.from(data), 'iso-8859-1');
    }
}
