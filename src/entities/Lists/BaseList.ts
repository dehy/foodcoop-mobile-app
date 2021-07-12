'use strict';

import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    TableInheritance,
    UpdateDateColumn,
} from 'typeorm';
import { InventoryListExtraData } from './InventoryList';
import ListAttachment from './ListAttachment';
import BaseEntry from './BaseEntry';
import { DateTime } from 'luxon';

export enum ListType {
    inventory = 'InventoryList',
    goodsReceipt = 'GoodsReceiptList',
    loss = 'loss',
    soldout = 'soldout',
    stickers = 'stickers',
    other = 'other',
}

export const ListTypeLabel = new Map<string, string>([
    [ListType.inventory, 'Inventaire'],
    [ListType.goodsReceipt, 'Réception de marchandises'],
    [ListType.loss, 'Pertes'],
    [ListType.soldout, 'Rupture de stock'],
    [ListType.stickers, 'Étiquettes'],
    [ListType.other, 'Autre'],
]);

export const ListTypeIcon = new Map<string, string>([
    [ListType.inventory, 'boxes'],
    [ListType.goodsReceipt, 'truck-loading'],
    [ListType.loss, 'dumpster'],
    [ListType.soldout, 'battery-empty'],
    [ListType.stickers, 'tags'],
    [ListType.other, 'ellipsis-h'],
]);

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export default abstract class BaseList {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column('text')
    public name?: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    comment?: string;

    @CreateDateColumn({ type: 'datetime' })
    public _createdAt?: Date;

    get createdAt(): DateTime | undefined {
        return this._createdAt ? DateTime.fromJSDate(this._createdAt) : undefined;
    }

    set createdAt(date: DateTime | undefined) {
        this._createdAt = date ? date.toJSDate() : undefined;
    }

    @UpdateDateColumn({ type: 'datetime' })
    public _lastModifiedAt?: Date;

    get lastModifiedAt(): DateTime | undefined {
        return this._lastModifiedAt ? DateTime.fromJSDate(this._lastModifiedAt) : undefined;
    }

    set lastModifiedAt(date: DateTime | undefined) {
        this._lastModifiedAt = date ? date.toJSDate() : undefined;
    }

    @Column({
        type: 'datetime',
        nullable: true,
    })
    public _lastSentAt?: Date;

    get lastSentAt(): DateTime | undefined {
        return this._lastSentAt ? DateTime.fromJSDate(this._lastSentAt) : undefined;
    }

    set lastSentAt(date: DateTime | undefined) {
        this._lastSentAt = date ? date.toJSDate() : undefined;
    }

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => ListAttachment,
        attachment => attachment.list,
    )
    attachments?: ListAttachment[];

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => BaseEntry,
        entry => entry.list,
    )
    entries?: BaseEntry[];

    @Column('simple-json')
    extraData: InventoryListExtraData | {};

    constructor() {
        this.extraData = {};
    }

    get typeLabel(): string {
        return ListTypeLabel.get(this.constructor.name) ?? 'unknown';
    }
}
