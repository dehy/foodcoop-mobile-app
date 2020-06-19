'use strict';

import { isFloat } from '../../utils/helpers';

export enum UnitOfMesurement {
    unit = 1,
    kg = 3,
    litre = 11,
}

export default class ProductProduct {
    public id?: number;
    public templateId?: number;
    public barcode?: string;
    public name?: string;
    public image?: string;
    public qtyAvailable?: number;
    public uomId?: number;
    public lstPrice?: number;
    public weightNet?: number;
    public volume?: number;

    static imageFromOdooBase64(imageBase64: string): string {
        return 'data:image/png;base64,' + imageBase64;
    }

    static quantityUnitAsString(odooUnit?: number): string {
        let string = '';
        switch (odooUnit) {
            case UnitOfMesurement.unit:
                string = 'unités';
                break;
            case UnitOfMesurement.kg:
                string = 'kg';
                break;
            case UnitOfMesurement.litre:
                string = 'litre';
                break;
        }

        return string;
    }

    unitAsString(): string {
        return ProductProduct.quantityUnitAsString(this.uomId);
    }

    quantityAsString(): string {
        return `${String(this.qtyAvailable)} ${this.unitAsString()}`;
    }

    packagingAsString(): string {
        let metricString = '';
        if (this.weightNet) {
            metricString = `${String(this.weightNet)} kg`;
        }
        if (this.volume) {
            metricString = `${String(this.volume)} L`;
        }
        return metricString;
    }

    quantityIsValid(): boolean {
        if (this.qtyAvailable == undefined || this.qtyAvailable < 0) {
            return false;
        }
        if (this.uomId === UnitOfMesurement.unit && isFloat(this.qtyAvailable)) {
            return false;
        }

        return true;
    }
}
