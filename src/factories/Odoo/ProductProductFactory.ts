'use strict';

import ProductProduct from '../../entities/Odoo/ProductProduct';

export default class ProductProductFactory {
    public static ProductProductFromResponse(response: OdooApiProductProduct): ProductProduct {
        const product = new ProductProduct();
        product.id = response.id;
        product.barcode = response.barcode;
        product.name = response.name;
        product.image = response.image != null ? response.image : undefined;
        product.qty_available = response.qty_available;
        product.uom_id = response.uom_id[0];
        product.lst_price = response.lst_price;
        product.weight_net = response.weight_net;
        product.volume = response.volume;

        return product;
    }
}
