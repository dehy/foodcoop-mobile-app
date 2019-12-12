import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import moment from 'moment';
import GoodsReceiptSession from './GoodsReceiptSession';

@Entity()
export default class GoodsReceiptEntry {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column('text')
    public name?: string;

    @Column('int')
    public packageQty?: number; // Colisage (nombre de produits par colis)

    @Column('int')
    public productQtyPackage?: number; // Nombre de colis

    @Column('text')
    public productBarcode?: string;

    @Column('int')
    public productId?: number;

    @Column('text')
    public productName?: string;

    @Column('int')
    public expectedProductQty?: number;

    @Column({
        type: 'int',
        nullable: true,
    })
    public productQty?: number; // Quantité totale

    @Column('int')
    public productUom?: number; // Unité de mesure d'article

    @Column({
        type: 'text',
        nullable: true,
    })
    public comment?: string;

    @ManyToOne(
        type => GoodsReceiptSession,
        goodsReceiptSession => goodsReceiptSession.goodsReceiptEntries,
    )
    public goodsReceiptSession?: GoodsReceiptSession;
}
