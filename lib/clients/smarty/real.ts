import type { SmartyClient, ValidateAddressInput, ValidatedAddress } from './types';
import { env } from '@/env';

export function createReal(): SmartyClient {
  const authId = env.SMARTY_AUTH_ID ?? '';
  const authToken = env.SMARTY_AUTH_TOKEN ?? '';
  if (!authId || !authToken) throw new Error('SMARTY_AUTH_ID and SMARTY_AUTH_TOKEN required');

  return {
    async validate(_input: ValidateAddressInput): Promise<ValidatedAddress | null> {
      throw new Error('SmartyReal not yet implemented');
    },
    async validateAddresses(_inputs: ValidateAddressInput[]): Promise<(ValidatedAddress | null)[]> {
      throw new Error('SmartyReal not yet implemented');
    },
  };
}
