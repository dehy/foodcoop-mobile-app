'use strict';

import ListAttachment from './ListAttachment';
import BaseEntry from './BaseEntry';

export enum ListType {
    Inventory = 'Inventory',
}

export default abstract class BaseList {
    public static icon = 'clipboard-list';
    public static label = 'Liste';
    public static entryClass = BaseEntry;

    icon(): string {
        const list = this.constructor as typeof BaseList;
        return list.icon;
    }

    label(): string {
        const list = this.constructor as typeof BaseList;
        return list.label;
    }

    static schema: Realm.ObjectSchema = {
        name: 'List',
        primaryKey: '_id',
        properties: {
            _id: 'objectId',
            _type: {type: 'string', indexed: true},
            name: 'string',
            comment: 'string?',
            createdAt: 'date',
            lastModifiedAt: 'date',
            lastSentAt: {type: 'date?', indexed: true},
            entries: {type: 'list', objectType: 'Entry'},
        },
    };

    public _id?: Realm.BSON.ObjectId;

    public _type: ListType;

    public name: string;

    public comment?: string;

    public createdAt: Date;

    public lastModifiedAt: Date;

    public lastSentAt?: Date;

    public attachments?: ListAttachment[];

    public entries?: BaseEntry[];

    constructor(type: ListType, name: string) {
        this._id = new Realm.BSON.ObjectID();
        this._type = type;
        this.name = name;
        this.createdAt = new Date();
        this.lastModifiedAt = this.createdAt;
    }
}
