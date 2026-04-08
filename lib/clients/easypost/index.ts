import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { EasyPostClient } from './types';

export function createEasyPostClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.EASYPOST_STRATEGY, override);
  console.log(`[client] easypost → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] easypost: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
