import { EntitySchema } from "typeorm"
import ListAttachment from "./ListAttachment"
import BaseList from "./BaseList"

export const BaseListEntity = new EntitySchema({
    target: BaseList,
    name: "lists",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        comment: {
            type: String,
            nullable: true
        },
        _createdAt: {
            type: Date,
            createDate: true
        },
        _lastModifiedAt: {
            type: Date,
            updateDate: true,
        },
        _lastSentAt: {
            type: Date,
            nullable: true
        },
        extraData: {
            type: "simple-json"
        }
    },
    relations: {
        attachments: {
            type: "one-to-many",
            target: "list_attachments",
            inverseSide: "list"
        },
        entries: {
            type: "one-to-many",
            target: "entries",
            inverseSide: "list"
        }
    },
    inheritance: {
        pattern: "STI",
        column: "type",
    },
})