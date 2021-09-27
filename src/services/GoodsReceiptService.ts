'use strict';

import Odoo from '../utils/Odoo';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';
import GoodsReceiptSession from '../entities/GoodsReceiptSession';
import GoodsReceiptList from '../entities/Lists/GoodsReceiptList';
import GoodsReceiptEntry from '../../src/entities/Lists/GoodsReceiptEntry';
import ListAttachment from '../entities/Lists/ListAttachment';
import { ImagePickerResponse } from 'react-native-image-picker';
import * as RNFS from 'react-native-fs';
import * as mime from 'react-native-mime-types';
import { lightRandomId } from '../../src/utils/helpers';
import { getRepository } from 'typeorm';
import Attachment from '../entities/Attachment';

export default class GoodsReceiptService {
    private static instance: GoodsReceiptService;

    private purchaseOrdersPlannedToday?: PurchaseOrder[];

    static getInstance(): GoodsReceiptService {
        if (GoodsReceiptService.instance == null) {
            GoodsReceiptService.instance = new GoodsReceiptService();
        }

        return this.instance;
    }

    async getPurchaseOrdersPlannedTodays(): Promise<PurchaseOrder[]> {
        if (this.purchaseOrdersPlannedToday == undefined) {
            this.purchaseOrdersPlannedToday = await Odoo.getInstance().fetchPurchaseOrdersPlannedToday();
        }

        return this.purchaseOrdersPlannedToday;
    }

    async attachementFromImagePicker(list: GoodsReceiptList, response: ImagePickerResponse): Promise<ListAttachment> {
        if (!response.uri) {
            Promise.reject();
        }

        const extension = response.type ? mime.extension(response.type) : 'jpeg';
        const attachmentBasename = `${list.purchaseOrderName}-${lightRandomId()}`;
        const attachmentFilename = `${attachmentBasename}.${extension}`;
        const attachmentShortFilepath = `${this.dataDirectoryRelativePathForList(list)}/${attachmentFilename}`;
        const attachmentFullFilepath = `${this.dataDirectoryAbsolutePathForList(list)}/${attachmentFilename}`;

        await RNFS.mkdir(this.dataDirectoryAbsolutePathForList(list));
        await RNFS.moveFile(response.uri, attachmentFullFilepath);

        const listAttachment = new ListAttachment();
        listAttachment.path = attachmentShortFilepath;
        listAttachment.type = response.type;
        listAttachment.name = attachmentFilename;
        listAttachment.list = list;

        return listAttachment;
    }

    async attachementFromImagePickerLegacy(
        session: GoodsReceiptSession,
        response: ImagePickerResponse,
    ): Promise<ListAttachment> {
        if (!response.uri) {
            Promise.reject();
        }

        const extension = response.type ? mime.extension(response.type) : 'jpeg';
        const attachmentBasename = `${session.poName}-${lightRandomId()}`;
        const attachmentFilename = `${attachmentBasename}.${extension}`;
        const attachmentShortFilepath = `${this.dataDirectoryRelativePathForSession(session)}/${attachmentFilename}`;
        const attachmentFullFilepath = `${this.dataDirectoryAbsolutePathForSession(session)}/${attachmentFilename}`;

        await RNFS.mkdir(this.dataDirectoryAbsolutePathForSession(session));
        await RNFS.moveFile(response.uri, attachmentFullFilepath);

        const attachment = new Attachment();
        attachment.path = attachmentShortFilepath;
        attachment.type = response.type;
        attachment.name = attachmentFilename;
        attachment.goodsReceiptSession = session;

        return attachment;
    }

    async deleteList(list: GoodsReceiptList): Promise<void> {
        const attachmentRepository = getRepository(ListAttachment);
        const entryRepository = getRepository(GoodsReceiptEntry);
        const listRepository = getRepository(GoodsReceiptList);

        await this.deleteAttachmentsFilesFromList(list);

        const attachments = await attachmentRepository.find({
            list: list,
        });
        for (const attachement of attachments) {
            await attachmentRepository.remove(attachement);
        }

        const entries = await entryRepository.find({
            list: list,
        });
        for (const entry of entries) {
            await entryRepository.remove(entry);
        }

        await listRepository.remove(list);
    }

    async deleteAttachmentsFilesFromList(list: GoodsReceiptList): Promise<void> {
        for (const attachement of list.attachments ?? []) {
            if (attachement.path && (await RNFS.exists(attachement.path))) {
                await RNFS.unlink(attachement.path);
            }
        }
        if (await RNFS.exists(this.dataDirectoryAbsolutePathForList(list))) {
            await RNFS.unlink(this.dataDirectoryAbsolutePathForList(list));
        }
    }

    dataDirectoryAbsolutePathForList(list: GoodsReceiptList): string {
        return `${RNFS.DocumentDirectoryPath}/${this.dataDirectoryRelativePathForList(list)}`;
    }

    dataDirectoryRelativePathForList(list: GoodsReceiptList): string {
        return `GoodsReceipts/${list.purchaseOrderName}`;
    }

    // Old
    async deleteSession(session: GoodsReceiptSession): Promise<void> {
        const attachmentRepository = getRepository(ListAttachment);
        const entryRepository = getRepository(GoodsReceiptEntry);
        const sessionRepository = getRepository(GoodsReceiptSession);

        await this.deleteAttachmentsFilesFromSession(session);

        const attachments = await attachmentRepository.find({
            list: session,
        });
        for (const attachement of attachments) {
            await attachmentRepository.remove(attachement);
        }

        const entries = await entryRepository.find({
            list: session,
        });
        for (const entry of entries) {
            await entryRepository.remove(entry);
        }

        await sessionRepository.remove(session);
    }

    async deleteAttachmentsFilesFromSession(session: GoodsReceiptSession): Promise<void> {
        for (const attachement of session.attachments ?? []) {
            if (attachement.path && (await RNFS.exists(attachement.path))) {
                await RNFS.unlink(attachement.path);
            }
        }
        if (await RNFS.exists(this.dataDirectoryAbsolutePathForSession(session))) {
            await RNFS.unlink(this.dataDirectoryAbsolutePathForSession(session));
        }
    }

    dataDirectoryAbsolutePathForSession(session: GoodsReceiptSession): string {
        return `${RNFS.DocumentDirectoryPath}/${this.dataDirectoryRelativePathForSession(session)}`;
    }

    dataDirectoryRelativePathForSession(session: GoodsReceiptSession): string {
        return `GoodsReceipts/${session.poName}`;
    }
}
