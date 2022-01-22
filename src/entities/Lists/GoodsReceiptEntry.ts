import {ChildEntity} from 'typeorm';
import BaseEntry from './BaseEntry';

export enum EntryStatus {
    VALID = 'OK',
    WARNING = 'ATTENTION',
    ERROR = 'ERREUR',
}

export type GoodsReceiptEntryExtraData = {
    packageQty: number | null; // Colisage (nombre de produits par colis)
    productQtyPackage: number | null; // Nombre de colis
    productSupplierCode: string | null;
    expectedPackageQty: number; // Colisage attendus (nombre de produits par colis)
    expectedProductQtyPackage: number; // Nombre de colis attendus
    expectedProductQty: number; // Nombre de produits au total attendus
    expectedProductUom: number; // Unité (kg, unité, litres) attendue
};

@ChildEntity()
export default class GoodsReceiptEntry extends BaseEntry {
    constructor() {
        super();

        this.packageQty = null;
        this.productQtyPackage = null;
    }

    get packageQty(): number | null {
        return (this.extraData as GoodsReceiptEntryExtraData).packageQty;
    }
    set packageQty(packageQty: number | null) {
        (this.extraData as GoodsReceiptEntryExtraData).packageQty = packageQty;
    }

    get productQtyPackage(): number | null {
        return (this.extraData as GoodsReceiptEntryExtraData).productQtyPackage;
    }
    set productQtyPackage(productQtyPackage: number | null) {
        (this.extraData as GoodsReceiptEntryExtraData).productQtyPackage = productQtyPackage;
    }

    get productSupplierCode(): string | null {
        return (this.extraData as GoodsReceiptEntryExtraData).productSupplierCode;
    }
    set productSupplierCode(productSupplierCode: string | null) {
        (this.extraData as GoodsReceiptEntryExtraData).productSupplierCode = productSupplierCode;
    }

    get expectedPackageQty(): number {
        return (this.extraData as GoodsReceiptEntryExtraData).expectedPackageQty;
    }
    set expectedPackageQty(expectedPackageQty: number) {
        (this.extraData as GoodsReceiptEntryExtraData).expectedPackageQty = expectedPackageQty;
    }

    get expectedProductQtyPackage(): number {
        return (this.extraData as GoodsReceiptEntryExtraData).expectedProductQtyPackage;
    }
    set expectedProductQtyPackage(expectedProductQtyPackage: number) {
        (this.extraData as GoodsReceiptEntryExtraData).expectedProductQtyPackage = expectedProductQtyPackage;
    }

    get expectedProductQty(): number {
        return (this.extraData as GoodsReceiptEntryExtraData).expectedProductQty;
    }
    set expectedProductQty(expectedProductQty: number) {
        (this.extraData as GoodsReceiptEntryExtraData).expectedProductQty = expectedProductQty;
    }

    get expectedProductUom(): number {
        return (this.extraData as GoodsReceiptEntryExtraData).expectedProductUom;
    }
    set expectedProductUom(expectedProductUom: number) {
        (this.extraData as GoodsReceiptEntryExtraData).expectedProductUom = expectedProductUom;
    }

    public isValidPackageQty(): boolean | null {
        if (this.packageQty === null) {
            return null;
        }
        return this.expectedPackageQty === this.packageQty;
    }

    public isValidProductQtyPackage(): boolean | null {
        if (this.productQtyPackage === null) {
            return null;
        }
        return this.expectedProductQtyPackage === this.productQtyPackage;
    }

    public isValidQuantity(): boolean | null {
        if (this.quantity === null) {
            return null;
        }
        return this.expectedProductQty === this.quantity;
    }

    public isValidUom(): boolean | null {
        if (this.unit === null) {
            return null;
        }
        return this.expectedProductUom === this.unit;
    }

    public hasComment(): boolean {
        if (!this.comment) {
            return false;
        }
        return this.comment.length > 0;
    }

    public isFilled(): boolean {
        return this.quantity !== null;
    }

    public getStatus(): EntryStatus {
        if (this.isValidQuantity() !== true) {
            return EntryStatus.ERROR;
        }
        if (
            this.isValidUom() !== true ||
            this.hasComment() ||
            this.isValidPackageQty() !== true ||
            this.isValidProductQtyPackage() !== true
        ) {
            return EntryStatus.WARNING;
        }
        return EntryStatus.VALID;
    }
}
