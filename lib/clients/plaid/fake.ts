import { fakeLog } from '../types';
import type { PlaidClient, CreateLinkTokenResult } from './types';

export function createFake(): PlaidClient {
  return {
    async createLinkToken(userId: string): Promise<CreateLinkTokenResult> {
      fakeLog('Plaid', 'createLinkToken', { userId });
      return {
        linkToken: '12345',
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      };
    },

    async exchangePublicToken(publicToken: string): Promise<string> {
      fakeLog('Plaid', 'exchangePublicToken', { publicToken: publicToken.slice(0, 20) });
      return 'abcdef';
    },

    async createProcessorToken(publicToken: string, accountId: string): Promise<string> {
      fakeLog('Plaid', 'createProcessorToken', { publicToken: publicToken.slice(0, 20), accountId });
      return 'ffffff';
    },
  };
}
