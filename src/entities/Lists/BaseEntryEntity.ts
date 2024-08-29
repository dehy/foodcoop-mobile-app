import { EntitySchema } from "typeorm"
import BaseEntry from "./BaseEntry"

export const BaseEntryEntity = new EntitySchema({
    target: BaseEntry,
    name: "entries",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        productBarcode: {
            type: String
        },
        productId: {
            type: Number
        },
        productName: {
            type: String
        },
        quantity: {
            type: "float",
            nullable: true
        },
        unit: {
            type: Number,
            nullable: true
        },
        price: {
            type: Number,
            nullable: true
        },
        comment: {
            type: "text",
            nullable: true
        },
        addedAt: {
            type: Date,
            createDate: true
        },
        lastModifiedAt: {
            type: Date,
            updateDate: true
        },
        extraData: {
            type: "simple-json"
        }
    },
    relations: {
        list: {
            type: "many-to-one",
            target: "lists",
            inverseSide: "entries",
            cascade: ["remove"]
        }
    },
    inheritance: {
        pattern: "STI",
        column: "type",
    },
})