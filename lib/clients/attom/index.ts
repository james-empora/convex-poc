import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { AttomClient } from './types';

export function createAttomClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.ATTOM_STRATEGY, override);
  console.log(`[client] attom → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] attom: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
