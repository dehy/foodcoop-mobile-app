'use strict';

import Odoo from '../utils/Odoo';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';

export default class GoodsReceiptService {
    private static instance: GoodsReceiptService;

    private purchaseOrdersPlannedToday?: PurchaseOrder[];

    static getInstance(): GoodsReceiptService {
        if (GoodsReceiptService.instance == null) {
            GoodsReceiptService.instance = new GoodsReceiptService();
        }

        return this.instance;
    }

    async getPurchaseOrdersPlannedTodays(): Promise<PurchaseOrder[]> {
        if (this.purchaseOrdersPlannedToday == undefined) {
            this.purchaseOrdersPlannedToday = await Odoo.getInstance().fetchPurchaseOrdersPlannedToday();
        }

        return this.purchaseOrdersPlannedToday;
    }
}
