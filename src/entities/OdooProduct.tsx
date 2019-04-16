'use strict'

export enum UnitOfMesurement {
    unit = 1,
    kg = 3
}

export default class OdooProduct {
    public barcode?: string;
    public name?: string;
    public image?: string|null;
    public qty_available?: number;
    public uom_id?: number;
    public lst_price?: number;
    public weight_net?: number;
    public volume?: number;

    static imageFromOdooBase64(imageBase64: string): string {
        return 'data:image/png;base64,' + imageBase64;
    }

    static quantityUnitAsString(odooUnit?: number): string {
        let string = "";
        switch (odooUnit) {
            case UnitOfMesurement.unit:
                string = "unités";
                break;
            case UnitOfMesurement.kg:
                string = "kg";
                break;
        }

        return string;
    }

    unitAsString(): string {
        return OdooProduct.quantityUnitAsString(this.uom_id);
    }

    quantityAsString(): string {
        return `${String(this.qty_available)} ${this.unitAsString()}`;
    }

    packagingAsString(): string {
        let metricString = "";
        if (this.weight_net) {
            metricString = `${String(this.weight_net)} kg`
        }
        if (this.volume) {
            metricString = `${String(this.volume)} L`
        }
        return metricString;
    }

    quantityIsValid(): boolean {
        if (this.qty_available == undefined) {
            throw new Error("Undefined quantity");
        }
        if (this.qty_available < 0) {
            return false;
        }
        if (this.uom_id === UnitOfMesurement.unit
            && this.qty_available.isFloat()) {
                return false;
        }

        return true;
    }
}