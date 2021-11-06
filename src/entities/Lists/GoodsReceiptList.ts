'use strict';

import { ChildEntity } from 'typeorm';
import BaseList from './BaseList';

export type GoodsReceiptListExtraData = {
    purchaseOrderId: number;
    purchaseOrderName: string;
    partnerId: number;
    partnerName: string;
};

@ChildEntity()
export default class GoodsReceiptList extends BaseList {
    public static icon = 'truck-loading';
    public static label = 'Réception';

    get purchaseOrderId(): number {
        return (this.extraData as GoodsReceiptListExtraData).purchaseOrderId;
    }
    set purchaseOrderId(purchaseOrderId: number) {
        (this.extraData as GoodsReceiptListExtraData).purchaseOrderId = purchaseOrderId;
    }

    get purchaseOrderName(): string {
        return (this.extraData as GoodsReceiptListExtraData).purchaseOrderName;
    }
    set purchaseOrderName(purchaseOrderName: string) {
        (this.extraData as GoodsReceiptListExtraData).purchaseOrderName = purchaseOrderName;
    }

    get partnerId(): number {
        return (this.extraData as GoodsReceiptListExtraData).partnerId;
    }
    set partnerId(partnerId: number) {
        (this.extraData as GoodsReceiptListExtraData).partnerId = partnerId;
    }

    get partnerName(): string {
        return (this.extraData as GoodsReceiptListExtraData).partnerName;
    }
    set partnerName(partnerName: string) {
        (this.extraData as GoodsReceiptListExtraData).partnerName = partnerName;
    }

    isReadyForExport = (): boolean => {
        if (undefined == this.entries) {
            return false;
        }
        for (const entry of this.entries) {
            if (undefined == entry.quantity) {
                return false;
            }
            if (undefined == entry.unit) {
                return false;
            }
        }
        return true;
    };
}
