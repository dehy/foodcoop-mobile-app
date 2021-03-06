import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import GoodsReceiptEntry from './GoodsReceiptEntry';
import Attachment from './Attachment';

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

    @Column('boolean')
    hidden = false;

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => GoodsReceiptEntry,
        goodsReceiptEntry => goodsReceiptEntry.goodsReceiptSession,
    )
    goodsReceiptEntries?: GoodsReceiptEntry[];

    @OneToMany(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => Attachment,
        attachment => attachment.goodsReceiptSession,
    )
    attachments?: Attachment[];

    isReadyForExport = (): boolean => {
        if (undefined == this.goodsReceiptEntries) {
            return false;
        }
        for (const entry of this.goodsReceiptEntries) {
            if (undefined == entry.productQty) {
                return false;
            }
            if (undefined == entry.productUom) {
                return false;
            }
        }
        return true;
    };
}
