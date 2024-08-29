import { EntitySchema } from "typeorm"
import LabelList from "./LabelList"
import { BaseListEntity } from "./BaseListEntity"

export const LabelListEntity = new EntitySchema({
    target: LabelList,
    name: "LabelList",
    type: "entity-child",
    columns: {
        ...BaseListEntity.options.columns,
    }
})