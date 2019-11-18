"use strict";

import PurchaseOrder from "./PurchaseOrder";

export default class PurchaseOrderLine {
  public id?: number;
  public name?: string;
  public packageQty?: number; // Colisage
  public productQtyPackage?: number; // Nombre de colis
  public productBarcode?: string;
  public productId?: number;
  public productName?: string;
  public productQty?: number; // Quantité (= Colisage * nombre de colis)
  public productUom?: number; // Unité de mesure d'article (kg ou unité)
  public purchaseOrder?: PurchaseOrder;
}
