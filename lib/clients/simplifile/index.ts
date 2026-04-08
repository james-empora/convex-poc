import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { SimplifileClient } from './types';

export function createSimplifileClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.SIMPLIFILE_STRATEGY, override);
  console.log(`[client] simplifile → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] simplifile: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
