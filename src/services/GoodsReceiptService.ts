'use strict';

import Odoo from '../utils/Odoo';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';
import GoodsReceiptSession from '../entities/GoodsReceiptSession';
import Attachment from '../entities/Attachment';
import { ImagePickerResponse } from 'react-native-image-picker';
import * as RNFS from 'react-native-fs';
import * as mime from 'react-native-mime-types';

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

        const attachmentsCount = (session.attachments && session.attachments.length) ?? 0;
        const extension = response.type ? mime.extension(response.type) : 'jpeg';
        // TODO: We should find a better unique filename
        const attachmentNameCount = `${session.poName}-${attachmentsCount + 1}`;
        const attachmentPath = `${this.dataDirectoryForSession(session)}/${attachmentNameCount}.${extension}`;

        await RNFS.mkdir(this.dataDirectoryForSession(session));
        await RNFS.copyFile(response.uri, attachmentPath);

        const name = attachmentPath.substring(attachmentPath.lastIndexOf('/') + 1, attachmentPath.length);
        const attachment: Attachment = {
            path: attachmentPath,
            type: response.type,
            name: name,
            goodsReceiptSession: session,
        };

        return attachment;
    }

    async deleteAttachmentsFromSession(session: GoodsReceiptSession) {

    }

    dataDirectoryForSession(session: GoodsReceiptSession): string {
        return `${RNFS.DocumentDirectoryPath}/GoodsReceipts/${session.poName}`;
    }
}
