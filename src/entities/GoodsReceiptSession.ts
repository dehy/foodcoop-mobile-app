import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany
} from "typeorm";
import Partner from "./Partner";
import GoodsReceiptEntry from "./GoodsReceiptEntry";
import PurchaseOrder from "./Odoo/PurchaseOrder";

@Entity()
export default class GoodsReceiptSession {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column("int")
  poId?: number;

  @Column("text")
  poName?: string;

  @Column("int")
  partnerId?: number;

  @Column("text")
  partnerName?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @Column({
    type: "date",
    nullable: true
  })
  lastSentAt?: Date;

  @Column({
    type: "text",
    nullable: true
  })
  comment?: string;

  @OneToMany(
    type => GoodsReceiptEntry,
    goodsReceiptEntry => goodsReceiptEntry.goodsReceiptSession
  )
  goodsReceiptEntries?: GoodsReceiptEntry[];
}
