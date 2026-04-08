import type { EasyPostClient, CreateShipmentInput, PurchaseShipmentInput, ShipmentResult, TrackerResult } from './types';
import { env } from '@/env';

export function createReal(): EasyPostClient {
  const apiKey = env.EASYPOST_API_KEY ?? '';
  if (!apiKey) throw new Error('EASYPOST_API_KEY required for EasyPost real client');

  return {
    async createShipment(_input: CreateShipmentInput): Promise<ShipmentResult> {
      throw new Error('EasyPostReal not yet implemented');
    },
    async purchaseShipment(_input: PurchaseShipmentInput): Promise<ShipmentResult> {
      throw new Error('EasyPostReal not yet implemented');
    },
    async convertPostageLabelToPdf(_shipmentId: string): Promise<ShipmentResult> {
      throw new Error('EasyPostReal not yet implemented');
    },
    async getShipment(_shipmentId: string): Promise<ShipmentResult> {
      throw new Error('EasyPostReal not yet implemented');
    },
    async createTracker(_carrier: string, _trackingCode: string): Promise<TrackerResult> {
      throw new Error('EasyPostReal not yet implemented');
    },
  };
}
