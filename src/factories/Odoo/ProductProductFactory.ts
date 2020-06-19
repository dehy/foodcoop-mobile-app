'use strict';

import ProductProduct from '../../entities/Odoo/ProductProduct';

export default class ProductProductFactory {
    public static ProductProductFromResponse(response: OdooApiProductProduct): ProductProduct {
        const product = new ProductProduct();
        product.id = response.id;
        if (response.product_tmpl_id && response.product_tmpl_id.length > 0 && response.product_tmpl_id[0]) {
            product.templateId = response.product_tmpl_id[0];
        }
        product.barcode = response.barcode;
        product.name = response.name;
        product.image = response.image != null ? response.image : undefined;
        product.qtyAvailable = response.qty_available;
        product.uomId = response.uom_id && response.uom_id[0];
        product.lstPrice = response.lst_price;
        product.weightNet = response.weight_net;
        product.volume = response.volume;

        return product;
    }
}
