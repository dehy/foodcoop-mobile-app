
import { EntitySchema } from "typeorm"
import ListAttachment from "./ListAttachment"

export const ListAttachmentEntity = new EntitySchema({
    target: ListAttachment,
    name: "list_attachments",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        name: {
            type: String,
        },
        path: {
            type: String,
        },
        type: {
            type: String,
        }
    },
    relations: {
        list: {
            type: "many-to-one",
            target: "lists",
            inverseSide: "attachments"
        },
    },
})