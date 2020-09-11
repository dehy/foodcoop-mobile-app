import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import GoodsReceiptSession from './GoodsReceiptSession';
import * as RNFS from 'react-native-fs';

@Entity()
export default class Attachment {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column('text')
    public name?: string;

    @Column('text')
    public path?: string;

    @Column('text')
    public type?: string;

    @ManyToOne(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type => GoodsReceiptSession,
        goodsReceiptSession => goodsReceiptSession.attachments,
    )
    public goodsReceiptSession?: GoodsReceiptSession;

    public filepath(): string {
        return RNFS.DocumentDirectoryPath + '/' + this.path;
    }
}
