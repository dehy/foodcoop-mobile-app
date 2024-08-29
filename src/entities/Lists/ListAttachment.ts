import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import * as RNFS from 'react-native-fs';
import BaseList from './BaseList';

export default class ListAttachment {
    public id?: number;

    public name?: string;

    public path?: string;

    public type?: string;

    public list?: BaseList;

    public filepath(): string {
        return RNFS.DocumentDirectoryPath + '/' + this.path;
    }
}
