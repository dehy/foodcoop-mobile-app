import InventoryEntryExtraData from './InventoryEntry';
import BaseList from './BaseList';
import {GoodsReceiptEntryExtraData} from './GoodsReceiptEntry';

export default abstract class BaseEntry {
    public id?: number | null = null; // null est un workaround pour un bug typeorm

    public type!: string;

    public productBarcode?: string;

    public productId?: number;

    public productName?: string;

    public quantity?: number;

    public unit?: number;

    public price?: number;

    public comment?: string;

    public addedAt?: Date;

    public lastModifiedAt?: Date;

    public list?: BaseList;

    public extraData: InventoryEntryExtraData | GoodsReceiptEntryExtraData | {};

    constructor() {
        this.extraData = {};
    }

    public hasComment(): boolean {
        if (!this.comment) {
            return false;
        }
        return this.comment.length > 0;
    }
}
