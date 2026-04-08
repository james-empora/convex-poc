import type { SimplifileClient, Recipient, Instrument, Package } from './types';
import { env } from '@/env';

export function createReal(): SimplifileClient {
  const apiToken = env.SIMPLIFILE_API_KEY ?? '';
  const apiUrl = env.SIMPLIFILE_API_URL ?? 'https://api.simplifile.com';
  const submitterId = env.SIMPLIFILE_SUBMITTER_ID ?? '';
  if (!apiToken) throw new Error('SIMPLIFILE_API_KEY required');

  void apiUrl;
  void submitterId;

  return {
    async recipients(_state: string): Promise<Recipient[]> {
      throw new Error('SimplifileReal not yet implemented');
    },
    async instruments(_recipientId: string): Promise<Instrument[]> {
      throw new Error('SimplifileReal not yet implemented');
    },
    async createPackage(_pkg: Package): Promise<string> {
      throw new Error('SimplifileReal not yet implemented');
    },
    async createViewPackageToken(_packageId: string): Promise<string> {
      throw new Error('SimplifileReal not yet implemented');
    },
    async createConsumeTokenUrl(_token: string): Promise<string> {
      throw new Error('SimplifileReal not yet implemented');
    },
  };
}
