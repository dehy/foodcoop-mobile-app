import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, TableInheritance, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import InventoryEntryExtraData from './InventoryEntry';
import BaseList from './BaseList';

@Entity()
@TableInheritance({ column: { type: "varchar", name: "type" } })
export default abstract class BaseEntry {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column('varchar')
    public productBarcode?: string;

    @Column('int')
    public productId?: number;

    @Column('varchar')
    public productName?: string;

    @Column('float')
    public quantity?: number;

    @Column('int')
    public unit?: number;

    @Column('float')
    public price?: number;

    @Column({
        type: 'text',
        nullable: true,
    })
    public comment?: string;

    @CreateDateColumn()
    public addedAt?: Date;

    @UpdateDateColumn()
    public lastModifiedAt?: Date;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => BaseList,
        list => list.entries,
        { onDelete: 'CASCADE' },
    )
    public list?: BaseList;

    @Column('simple-json')
    public extraData: InventoryEntryExtraData | {};

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
