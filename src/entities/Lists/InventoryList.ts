'use strict';

import { Icon } from 'react-native-elements';
import { ChildEntity } from 'typeorm';
import BaseList from './BaseList';

export type InventoryListExtraData = {
    zone: number;
};

@ChildEntity()
export default class InventoryList extends BaseList {
    static icon = 'boxes';
    static label = 'Inventaire';

    get zone(): number {
        return (this.extraData as InventoryListExtraData).zone;
    }
    set zone(zone: number) {
        (this.extraData as InventoryListExtraData).zone = zone;
    }
}
