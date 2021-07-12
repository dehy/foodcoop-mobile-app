'use strict';

import { ChildEntity } from 'typeorm';
import BaseEntry from './BaseEntry';

export type InventoryEntryExtraData = {
    quantity: number;
};

@ChildEntity()
export default class InventoryEntry extends BaseEntry {
}
