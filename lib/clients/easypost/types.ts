export interface Address {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface Parcel {
  length?: number;
  width?: number;
  height?: number;
  weight: number; // oz
}

export interface ShipmentRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  deliveryDays: number | null;
  sortIndex: number;
}

export interface PostageLabel {
  id: string;
  labelPdfUrl?: string;
}

export interface Shipment {
  id: string;
  trackingCode: string | null;
  trackingUrl: string | null;
  selectedRateId: string | null;
}

export interface ShipmentResult {
  shipment: Shipment;
  rates: ShipmentRate[];
  postageLabel: PostageLabel | null;
  error: string | null;
}

export interface TrackerResult {
  id: string;
  trackingUrl: string | null;
  trackingCode: string;
  carrier: string;
  error: string | null;
}

export interface CreateShipmentInput {
  fromAddress: Address;
  toAddress: Address;
  parcel: Parcel;
  carrierAccounts?: string[];
  isReturn?: boolean;
}

export interface PurchaseShipmentInput {
  shipmentId: string;
  rateId: string;
}

export interface EasyPostClient {
  createShipment(input: CreateShipmentInput): Promise<ShipmentResult>;
  purchaseShipment(input: PurchaseShipmentInput): Promise<ShipmentResult>;
  convertPostageLabelToPdf(shipmentId: string): Promise<ShipmentResult>;
  getShipment(shipmentId: string): Promise<ShipmentResult>;
  createTracker(carrier: string, trackingCode: string): Promise<TrackerResult>;
}
