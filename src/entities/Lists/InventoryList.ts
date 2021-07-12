'use strict';

import { ChildEntity, OneToMany } from 'typeorm';
import BaseList from './BaseList';

export type InventoryListExtraData = {
    zone: number;
};

@ChildEntity()
export default class InventoryList extends BaseList {
    get zone(): number {
        return (this.extraData as InventoryListExtraData).zone;
    }
    set zone(zone: number) {
        (this.extraData as InventoryListExtraData).zone = zone;
    }
}
