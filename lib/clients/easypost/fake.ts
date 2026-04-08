import { fakeLog } from '../types';
import type { EasyPostClient, CreateShipmentInput, PurchaseShipmentInput, ShipmentResult, TrackerResult } from './types';

// Service level sort order (lower = preferred) — matches Ruby gem
const _SERVICE_SORT: Record<string, number> = {
  'NextDayAir': 0,
  'NextDayAirSaver': 1,
  'NextDayAirEarlyAM': 2,
  '2ndDayAir': 3,
  'Ground': 4,
  'Priority Mail': 1,
  'Express': 0,
};

const MOCK_RATES = [
  { id: 'rate_fake_001', carrier: 'UPS', service: 'NextDayAir', rate: '10.07', deliveryDays: 1, sortIndex: 0 },
  { id: 'rate_fake_002', carrier: 'UPS', service: 'NextDayAirSaver', rate: '44.55', deliveryDays: 1, sortIndex: 1 },
  { id: 'rate_fake_003', carrier: 'UPS', service: 'NextDayAirEarlyAM', rate: '9.16', deliveryDays: 1, sortIndex: 2 },
  { id: 'rate_fake_004', carrier: 'UPS', service: 'Ground', rate: '11.45', deliveryDays: 5, sortIndex: 4 },
  { id: 'rate_fake_005', carrier: 'USPS', service: 'Priority Mail', rate: '8.95', deliveryDays: 2, sortIndex: 1 },
];

const FAKE_LABEL_URL = 'https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/20221017/3e5031aad94d4612a8bf2fba0daa4817.pdf';

export function createFake(): EasyPostClient {
  return {
    async createShipment(input: CreateShipmentInput): Promise<ShipmentResult> {
      fakeLog('EasyPost', 'createShipment', { to: input.toAddress.city, weight: input.parcel.weight });
      return {
        shipment: { id: 'shp_fake_123', trackingCode: null, trackingUrl: null, selectedRateId: null },
        rates: MOCK_RATES,
        postageLabel: null,
        error: null,
      };
    },

    async purchaseShipment(input: PurchaseShipmentInput): Promise<ShipmentResult> {
      fakeLog('EasyPost', 'purchaseShipment', { shipmentId: input.shipmentId, rateId: input.rateId });
      const trackingCode = '9461200106068143633001';
      return {
        shipment: {
          id: input.shipmentId,
          trackingCode,
          trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingCode}`,
          selectedRateId: input.rateId,
        },
        rates: MOCK_RATES,
        postageLabel: { id: 'pl_fake_123', labelPdfUrl: FAKE_LABEL_URL },
        error: null,
      };
    },

    async convertPostageLabelToPdf(shipmentId: string): Promise<ShipmentResult> {
      fakeLog('EasyPost', 'convertPostageLabelToPdf', { shipmentId });
      const trackingCode = '9461200106068143633001';
      return {
        shipment: {
          id: shipmentId,
          trackingCode,
          trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingCode}`,
          selectedRateId: 'rate_fake_001',
        },
        rates: MOCK_RATES,
        postageLabel: { id: 'pl_fake_123', labelPdfUrl: FAKE_LABEL_URL },
        error: null,
      };
    },

    async getShipment(shipmentId: string): Promise<ShipmentResult> {
      fakeLog('EasyPost', 'getShipment', { shipmentId });
      return {
        shipment: { id: shipmentId, trackingCode: null, trackingUrl: null, selectedRateId: null },
        rates: MOCK_RATES,
        postageLabel: null,
        error: null,
      };
    },

    async createTracker(carrier: string, trackingCode: string): Promise<TrackerResult> {
      fakeLog('EasyPost', 'createTracker', { carrier, trackingCode });
      return {
        id: 'trk_fake_123',
        trackingUrl: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingCode}`,
        trackingCode,
        carrier,
        error: null,
      };
    },
  };
}
