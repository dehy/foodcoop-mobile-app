'use strict';

import { isFloat } from '../../utils/helpers';

export enum UnitOfMeasurement {
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
            case UnitOfMeasurement.unit:
                string = 'unités';
                break;
            case UnitOfMeasurement.kg:
                string = 'kg';
                break;
            case UnitOfMeasurement.litre:
                string = 'litre';
                break;
        }

        return string;
    }

    unitAsString(): string {
        return ProductProduct.quantityUnitAsString(this.uomId);
    }

    quantityAsString(): string {
        return `${String(this.qtyAvailable?.toPrecision())} ${this.unitAsString()}`;
    }

    packagingUnit(): number {
        if (this.weightNet) {
            return UnitOfMeasurement.kg;
        }
        if (this.volume) {
            return UnitOfMeasurement.litre;
        }
        return UnitOfMeasurement.unit;
    }

    packagingAsString(): string {
        let metricString = '';
        if (this.weightNet) {
            metricString = `${String(this.weightNet)} kg`;
            if (this.weightNet < 1) {
                metricString = `${String(this.weightNet * 1000)} g`;
            }
        }
        if (this.volume) {
            metricString = `${String(this.volume)} L`;
            if (this.volume < 1) {
                metricString = `${String(this.volume * 1000)} mL`;
            }
        }
        return metricString;
    }

    quantityIsValid(): boolean {
        if (this.qtyAvailable == undefined || this.qtyAvailable < 0) {
            return false;
        }
        if (this.uomId === UnitOfMeasurement.unit && isFloat(this.qtyAvailable)) {
            return false;
        }

        return true;
    }
}
