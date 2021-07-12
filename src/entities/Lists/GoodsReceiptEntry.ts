import { ChildEntity } from 'typeorm';
import BaseEntry from './BaseEntry';

type GoodsReceiptEntryExtraData = {};

@ChildEntity()
export default class GoodsReceiptEntry extends BaseEntry {

}
