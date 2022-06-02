import ProductProduct from '../Odoo/ProductProduct';

export default class BaseEntry {
    static schema: Realm.ObjectSchema = {
        name: 'Entry',
        embedded: true,
        properties: {
            name: 'string',
            barcode: 'string',
            odooId: 'int?',
            unit: 'int',
            price: 'float',
            quantity: 'float',
            comment: 'string?',
            addedAt: 'date',
            lastModifiedAt: 'date',
        },
    };

    public name?: string;
    public barcode?: string;
    public odooId?: number;
    public unit?: number;
    public price?: number;
    public quantity?: number;
    public comment?: string;
    public addedAt?: Date;
    public lastModifiedAt?: Date;

    constructor(name: string, barcode: string | undefined) {
        this.name = name;
        this.barcode = barcode;
        this.addedAt = new Date();
        this.lastModifiedAt = this.addedAt;
    }

    public hasComment(): boolean {
        if (!this.comment) {
            return false;
        }
        return this.comment.length > 0;
    }

    static createFromProductProduct(product: ProductProduct): BaseEntry {
        const newEntry = new this(product.name, product.barcode);
        newEntry.odooId = product.id;
        newEntry.unit = product.uomId;
        newEntry.price = product.lstPrice;
        newEntry.quantity = product.qtyAvailable;
        return newEntry;
    }

    barcodeFoundInOdoo(): boolean {
        return this.odooId !== undefined;
    }
}
