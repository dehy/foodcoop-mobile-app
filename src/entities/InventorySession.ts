'use strict';

import { Moment } from 'moment';

export default class InventorySession {
    public id?: number;
    public date?: Moment;
    public zone?: number;
    public lastModifiedAt?: Moment;
    public lastSentAt?: Moment;
}
