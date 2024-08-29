'use strict';

import BaseList from './BaseList';

export type InventoryListExtraData = {
    zone: number;
};

export default class InventoryList extends BaseList {
    public static icon = 'boxes';
    public static label = 'Inventaire';

    get zone(): number {
        return (this.extraData as InventoryListExtraData).zone;
    }
    set zone(zone: number) {
        (this.extraData as InventoryListExtraData).zone = zone;
    }
}
