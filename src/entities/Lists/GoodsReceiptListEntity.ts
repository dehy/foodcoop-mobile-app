import { EntitySchema } from "typeorm"
import InventoryList from "./InventoryList"
import { BaseListEntity } from "./BaseListEntity"
import GoodsReceiptList from "./GoodsReceiptList"

export const GoodsReceiptListEntity = new EntitySchema({
    target: GoodsReceiptList,
    name: "GoodsReceiptList",
    type: "entity-child",
    columns: {
        ...BaseListEntity.options.columns,
    }
})