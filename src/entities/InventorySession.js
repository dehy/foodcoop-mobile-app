'use strict'

export default class InventorySession {
    constructor (json) {
        json = json || {}
    
        this.id = json.id ? json.id : null;
        this.date = json.date ? json.date : null;
        this.zone = json.zone ? json.zone : null;
        this.lastModifiedAt = json.last_modified_at ? json.last_modified_at : null;
        this.lastSentAt = json.last_sent_at ? json.last_sent_at : null;
    }
}