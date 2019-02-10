'use strict'

import moment from 'moment';

export default class InventoryEntry {
    constructor (json) {
        json = json || {}
    
        this.id = json.id ? json.id : null;
        this.inventoryId = json.inventory_id ? json.inventory_id : null;
        this.articleBarcode = json.article_barcode ? json.article_barcode : null;
        this.articleName = json.article_name ? json.article_name : null;
        this.articleImage = json.article_image ? json.article_image : null;
        this.articleUnit = json.article_unit ? json.article_unit : null;
        this.articlePrice = json.article_price ? json.article_price : null;
        this.scannedAt = json.scanned_at ? json.scanned_at : null;
        this.articleQuantity = json.article_quantity ? json.article_quantity : null;
        this.savedAt = json.saved_at ? json.saved_at : null;
    }
}