import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { SmartyClient } from './types';

export function createSmartyClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.SMARTY_STRATEGY, override);
  console.log(`[client] smarty → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] smarty: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
