import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import GoodsReceiptEntry from './GoodsReceiptEntry';

@Entity()
export default class GoodsReceiptSession {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column('int')
    poId?: number;

    @Column('text')
    poName?: string;

    @Column('int')
    partnerId?: number;

    @Column('text')
    partnerName?: string;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @Column({
        type: 'date',
        nullable: true,
    })
    lastSentAt?: Date;

    @Column({
        type: 'text',
        nullable: true,
    })
    comment?: string;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => GoodsReceiptEntry,
        goodsReceiptEntry => goodsReceiptEntry.goodsReceiptSession,
    )
    goodsReceiptEntries?: GoodsReceiptEntry[];
}
