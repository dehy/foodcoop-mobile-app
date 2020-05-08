import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import GoodsReceiptSession from './GoodsReceiptSession';

export enum EntryStatus {
    VALID = 'OK',
    WARNING = 'ATTENTION',
    ERROR = 'ERREUR',
}

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

    @Column({
        type: 'text',
        nullable: true,
    })
    public productSupplierCode?: string;

    @Column('int')
    public expectedProductQty?: number;

    @Column('int')
    public expectedProductUom?: number;

    @Column({
        type: 'int',
        nullable: true,
    })
    public productQty?: number; // Quantité totale

    @Column({
        type: 'int',
        nullable: true,
    })
    public productUom?: number; // Unité de mesure d'article

    @Column({
        type: 'text',
        nullable: true,
    })
    public comment?: string;

    @Column('boolean')
    public isExtra = false;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => GoodsReceiptSession,
        goodsReceiptSession => goodsReceiptSession.goodsReceiptEntries,
    )
    public goodsReceiptSession?: GoodsReceiptSession;

    public isValidQuantity(): boolean | null {
        if (null === this.productQty) {
            return null;
        }
        return this.expectedProductQty === this.productQty;
    }

    public isValidUom(): boolean | null {
        if (null === this.productUom) {
            return null;
        }
        return this.expectedProductUom === this.productUom;
    }

    public hasComment(): boolean {
        if (!this.comment) {
            return false;
        }
        return this.comment.length > 0;
    }

    public getStatus(): EntryStatus {
        if (false === this.isValidQuantity()) {
            return EntryStatus.ERROR;
        }
        if (false === this.isValidUom() || this.hasComment()) {
            return EntryStatus.WARNING;
        }
        return EntryStatus.VALID;
    }
}
