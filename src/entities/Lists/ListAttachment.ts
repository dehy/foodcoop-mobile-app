import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import * as RNFS from 'react-native-fs';
import BaseList from './BaseList';

@Entity()
export default class ListAttachment {
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
        type => BaseList,
        list => list.attachments,
    )
    public list?: BaseList;

    public filepath(): string {
        return RNFS.DocumentDirectoryPath + '/' + this.path;
    }
}
