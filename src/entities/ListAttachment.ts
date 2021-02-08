import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import * as RNFS from 'react-native-fs';
import List from './List';

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
        type => List,
        list => list.attachments,
    )
    public list?: List;

    public filepath(): string {
        return RNFS.DocumentDirectoryPath + '/' + this.path;
    }
}
