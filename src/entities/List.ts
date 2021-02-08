'use strict';

import { DateTime } from 'luxon';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import ListAttachment from './ListAttachment';
import ListEntry from './ListEntry';

export enum ListType {
    inventory = 'inventory',
    goodsReceipt = 'goods-receipt',
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
export default class List {
    @PrimaryGeneratedColumn()
    public id?: number;
    
    @Column('text')
    public name?: string;

    @Column('text')
    public type?: ListType;

    @Column({
        type: 'text',
        nullable: true,
    })
    comment?: string;

    @CreateDateColumn()
    public createdAt?: DateTime;

    @UpdateDateColumn()
    public lastModifiedAt?: DateTime;

    @Column({
        type: 'date',
        nullable: true,
    })
    public lastSentAt?: DateTime;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => ListEntry,
        listEntry => listEntry.list,
    )
    listEntries?: ListEntry[];

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => ListAttachment,
        attachment => attachment.list,
    )
    attachments?: ListAttachment[];
}
