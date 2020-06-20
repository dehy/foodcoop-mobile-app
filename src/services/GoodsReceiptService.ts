'use strict';

import Odoo from '../utils/Odoo';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';
import GoodsReceiptSession from '../entities/GoodsReceiptSession';
import GoodsReceiptEntry from '../../src/entities/GoodsReceiptEntry';
import Attachment from '../entities/Attachment';
import { ImagePickerResponse } from 'react-native-image-picker';
import * as RNFS from 'react-native-fs';
import * as mime from 'react-native-mime-types';
import { randomId } from '../../src/utils/helpers';
import { getRepository } from 'typeorm';

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

    async attachementFromImagePicker(session: GoodsReceiptSession, response: ImagePickerResponse): Promise<Attachment> {
        if (!response.uri) {
            Promise.reject();
        }

        const extension = response.type ? mime.extension(response.type) : 'jpeg';
        const attachmentBasename = `${session.poName}-${randomId()}`;
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

    async deleteSession(session: GoodsReceiptSession): Promise<void> {
        const attachmentRepository = getRepository(Attachment);
        const entryRepository = getRepository(GoodsReceiptEntry);
        const sessionRepository = getRepository(GoodsReceiptSession);

        await this.deleteAttachmentsFilesFromSession(session);

        const attachments = await attachmentRepository.find({
            goodsReceiptSession: session,
        });
        attachments?.forEach(async attachement => {
            await attachmentRepository.remove(attachement);
        });

        const entries = await entryRepository.find({
            goodsReceiptSession: session,
        });
        entries?.forEach(async entry => {
            await entryRepository.remove(entry);
        });

        await sessionRepository.remove(session);

        return;
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
        return;
    }

    dataDirectoryAbsolutePathForSession(session: GoodsReceiptSession): string {
        return `${RNFS.DocumentDirectoryPath}/${this.dataDirectoryRelativePathForSession(session)}`;
    }

    dataDirectoryRelativePathForSession(session: GoodsReceiptSession): string {
        return `GoodsReceipts/${session.poName}`;
    }
}
