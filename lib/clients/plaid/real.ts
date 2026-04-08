import type { PlaidClient, CreateLinkTokenResult } from './types';
import { env } from '@/env';

export function createReal(): PlaidClient {
  const clientId = env.PLAID_CLIENT_ID ?? '';
  const secret = env.PLAID_SECRET ?? '';
  if (!clientId || !secret) throw new Error('PLAID_CLIENT_ID and PLAID_SECRET required');

  return {
    async createLinkToken(_userId: string): Promise<CreateLinkTokenResult> {
      throw new Error('PlaidReal not yet implemented');
    },
    async exchangePublicToken(_publicToken: string): Promise<string> {
      throw new Error('PlaidReal not yet implemented');
    },
    async createProcessorToken(_publicToken: string, _accountId: string): Promise<string> {
      throw new Error('PlaidReal not yet implemented');
    },
  };
}
