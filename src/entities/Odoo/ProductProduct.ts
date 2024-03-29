'use strict';

import {isFloat} from '../../utils/helpers';

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
    public image?: string | null;
    public qtyAvailable?: number;
    public uomId?: number;
    public lstPrice?: number;
    public weightNet?: number;
    public volume?: number;

    static imageFromOdooBase64(imageBase64: string): string | undefined {
        // https://stackoverflow.com/a/50111377/2287525
        let imageType: string | undefined;
        switch (imageBase64.charAt(0)) {
            case '/':
                imageType = 'jpg';
                break;
            case 'i':
                imageType = 'png';
                break;
            case 'R':
                imageType = 'gif';
                break;
            case 'U':
                imageType = 'webp';
                break;
        }
        if (undefined === imageType) {
            console.warn('Unknown image type, base64 starting with "' + imageBase64.charAt(0) + '"');
            return;
        }
        return 'data:image/' + imageType + ';base64,' + imageBase64;
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
        if (this.qtyAvailable === undefined || this.qtyAvailable < 0) {
            return false;
        }
        if (this.uomId === UnitOfMeasurement.unit && isFloat(this.qtyAvailable)) {
            return false;
        }

        return true;
    }
}
