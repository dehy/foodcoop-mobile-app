import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import List from './List';

@Entity()
export default class ListEntry {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column('text')
    public name?: string;

    @Column({
        type: 'int',
        nullable: true,
    })
    public packageQty?: number; // Colisage (nombre de produits par colis)

    @Column({
        type: 'int',
        nullable: true,
    })
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

    @Column({
        type: 'text',
        nullable: true,
    })
    public comment?: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => List,
        list => list.listEntries,
        { onDelete: 'CASCADE' },
    )
    public list?: List;

    public hasComment(): boolean {
        if (!this.comment) {
            return false;
        }
        return this.comment.length > 0;
    }
}
