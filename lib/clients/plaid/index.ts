import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { PlaidClient } from './types';

export function createPlaidClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.PLAID_STRATEGY, override);
  console.log(`[client] plaid → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] plaid: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
