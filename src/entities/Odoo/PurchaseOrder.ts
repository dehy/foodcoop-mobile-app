"use strict";

import PurchaseOrderLine from "./PurchaseOrderLine";

export default class PurchaseOrder {
  public id?: number;
  public name?: string;
  public partnerId?: number;
  public partnerName?: string;
  public purchaseOrderLines?: PurchaseOrderLine[];
  public orderDate?: Date;
  public plannedDeliveryDate?: Date;
}
