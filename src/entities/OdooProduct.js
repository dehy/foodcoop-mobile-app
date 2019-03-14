'use strict'

export default class OdooProduct {
    static UNIT_OF_MESUREMENT_UNITY = 1;
    static UNIT_OF_MESUREMENT_KG = 3;

    constructor (odooJson) {
        const json = odooJson || {}
    
        this.barcode = json.barcode != undefined ? json.barcode : null;
        this.name = json.name != undefined ? json.name : null;
        this.image = json.image != undefined ? OdooProduct.imageFromOdooBase64(json.image) : null;
        this.qty_available = json.qty_available != undefined ? json.qty_available : null;
        this.uom_id = json.uom_id != undefined ? json.uom_id[0] : null;
        this.lst_price = json.lst_price != undefined ? json.lst_price : null;
        this.weight_net = json.weight_net != undefined ? json.weight_net : null; // kg
        this.volume = json.volume != undefined ? json.volume : null; // liters
    }

    static imageFromOdooBase64(imageBase64) {
        return 'data:image/png;base64,' + imageBase64;
    }

    static quantityUnitAsString(odooUnit) {
        let string = "";
        switch (odooUnit) {
            case OdooProduct.UNIT_OF_MESUREMENT_UNITY:
                string = "unités";
                break;
            case OdooProduct.UNIT_OF_MESUREMENT_KG:
                string = "kg";
                break;
        }

        return string;
    }

    unitAsString() {
        return OdooProduct.quantityUnitAsString(this.uom_id);
    }

    quantityAsString() {
        return `${String(this.qty_available)} ${this.unitAsString()}`;
    }

    packagingAsString() {
        let metricString = "";
        if (this.weight_net) {
            metricString = `${String(this.weight_net)} kg`
        }
        if (this.volume) {
            metricString = `${String(this.volume)} L`
        }
        return metricString;
    }

    quantityIsValid() {
        if (this.qty_available === null) {
            return true;
        }
        if (this.qty_available < 0) {
            return false;
        }
        if (this.uom_id === OdooProduct.UNIT_OF_MESUREMENT_UNITY
            && this.qty_available.isFloat()) {
                return false;
        }

        return true;
    }
}