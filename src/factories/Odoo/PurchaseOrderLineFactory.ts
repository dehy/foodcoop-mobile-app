'use strict';

import PurchaseOrderLine from '../../entities/Odoo/PurchaseOrderLine';

export default class PurchaseOrderLineFactory {
    public static PurchaseOrderLineFromResponse(response: OdooApiPurchaseOrderLine): PurchaseOrderLine {
        const purchaseOrderLine = new PurchaseOrderLine();
        purchaseOrderLine.id = response.id;
        purchaseOrderLine.name = response.name;
        purchaseOrderLine.productId = response.product_id && response.product_id[0];
        purchaseOrderLine.packageQty = response.package_qty;
        purchaseOrderLine.productQtyPackage = response.product_qty_package;
        purchaseOrderLine.productQty = response.product_qty;
        purchaseOrderLine.productUom = response.product_uom && response.product_uom[0];

        return purchaseOrderLine;
    }
}
