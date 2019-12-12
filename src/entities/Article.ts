'use strict';

export default class Article {
    public id: number;
    public barcode: string;
    public name: string;
    public imageData: string;
    public unit: number;
    public price: number;

    constructor(json: any) {
        json = json || {};

        this.id = json.id ? json.id : null;
        this.barcode = json.barcode ? json.barcode : '';
        this.name = json.name ? json.name : '';
        this.imageData = json.image ? 'data:image/png;base64,' + json.image : '';
        this.unit = json.uom_id ? json.uom_id[0] : null;
        this.price = json.standard_price ? json.standard_price : null;
    }
}
