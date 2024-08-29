import { EntitySchema } from "typeorm"
import InventoryList from "./InventoryList"
import { BaseListEntity } from "./BaseListEntity"

export const InventoryListEntity = new EntitySchema({
    target: InventoryList,
    name: "InventoryList",
    type: "entity-child",
    columns: {
        ...BaseListEntity.options.columns,
    }
})