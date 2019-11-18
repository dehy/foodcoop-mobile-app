"use strict";

import moment from "moment";
import Odoo from "../../utils/Odoo";
import PurchaseOrder from "../../entities/Odoo/PurchaseOrder";

export default class PurchaseOrderFactory {
  public static PurchaseOrderFromResponse(
    response: OdooApiPurchaseOrder
  ): PurchaseOrder {
    const purchaseOrder = new PurchaseOrder();
    purchaseOrder.id = response.id;
    purchaseOrder.name = response.name;
    purchaseOrder.partnerId = response.partner_id![0];
    purchaseOrder.partnerName = response.partner_id![1];
    purchaseOrder.orderDate = moment(
      response.date_order,
      Odoo.DATETIME_FORMAT
    ).toDate();
    purchaseOrder.plannedDeliveryDate = moment(
      response.date_planned,
      Odoo.DATETIME_FORMAT
    ).toDate();

    return purchaseOrder;
  }
}
