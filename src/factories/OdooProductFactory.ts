'use strict'

import OdooProduct from "../entities/OdooProduct";

export default class OdooProductFactory {
    public static OdooProductFromResponse(response: OdooApiProductProduct): OdooProduct {
        const product = new OdooProduct();
        product.barcode = response.barcode;
        product.name = response.name;;
        product.image = response.image;
        product.qty_available = response.qty_available;
        product.uom_id = response.uom_id;
        product.lst_price = response.lst_price;
        product.weight_net = response.weight_net;
        product.volume = response.volume;

        return product;
    }
}