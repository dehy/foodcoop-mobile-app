'use strict';

import Odoo from '../utils/Odoo';
import PurchaseOrder from '../entities/Odoo/PurchaseOrder';
import GoodsReceiptList from '../entities/Lists/GoodsReceiptList';
import GoodsReceiptEntry from '../../src/entities/Lists/GoodsReceiptEntry';
import ListAttachment from '../entities/Lists/ListAttachment';
import {ImagePickerResponse} from 'react-native-image-picker';
import * as RNFS from 'react-native-fs';
import * as mime from 'react-native-mime-types';
import {lightRandomId} from '../../src/utils/helpers';
import Database from '../utils/Database';

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
        if (this.purchaseOrdersPlannedToday === undefined) {
            this.purchaseOrdersPlannedToday = await Odoo.getInstance().fetchPurchaseOrdersPlannedToday();
        }

        return this.purchaseOrdersPlannedToday;
    }

    async attachementsFromImagePickerResponse(
        list: GoodsReceiptList,
        response: ImagePickerResponse,
    ): Promise<ListAttachment[]> {
        const attachments: ListAttachment[] = [];

        response.assets?.forEach(async asset => {
            if (!asset.uri) {
                Promise.reject();
                return;
            }

            const extension = asset.type ? mime.extension(asset.type) : 'jpeg';
            const attachmentBasename = `${list.purchaseOrderName}-${lightRandomId()}`;
            const attachmentFilename = `${attachmentBasename}.${extension}`;
            const attachmentShortFilepath = `${this.dataDirectoryRelativePathForList(list)}/${attachmentFilename}`;
            const attachmentFullFilepath = `${this.dataDirectoryAbsolutePathForList(list)}/${attachmentFilename}`;

            await RNFS.mkdir(this.dataDirectoryAbsolutePathForList(list));
            await RNFS.moveFile(asset.uri, attachmentFullFilepath);

            const listAttachment = new ListAttachment();
            listAttachment.path = attachmentShortFilepath;
            listAttachment.type = asset.type;
            listAttachment.name = attachmentFilename;
            listAttachment.list = list;

            attachments.push(listAttachment);
        });

        return attachments;
    }

    async deleteList(list: GoodsReceiptList): Promise<void> {
        const attachmentRepository = Database.sharedInstance().dataSource.getRepository(ListAttachment);
        const entryRepository = Database.sharedInstance().dataSource.getRepository(GoodsReceiptEntry);
        const listRepository = Database.sharedInstance().dataSource.getRepository(GoodsReceiptList);

        await this.deleteAttachmentsFilesFromList(list);

        const attachments = await attachmentRepository.find({
            where: {
                list: {
                    id: list.id!,
                },
            },
        });
        for (const attachement of attachments) {
            await attachmentRepository.remove(attachement);
        }

        const entries = await entryRepository.find({
            where: {
                list: {
                    id: list.id!,
                },
            },
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
}
