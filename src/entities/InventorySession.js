'use strict'

export default class InventorySession {
    constructor (json) {
        json = json || {}
    
        this.id = json.id ? json.id : null;
        this.date = json.date ? json.date : null;
        this.zone = json.zone ? json.zone : null;
    }
}