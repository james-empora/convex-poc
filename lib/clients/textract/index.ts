import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { TextractClient } from './types';

export function createTextractClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.TEXTRACT_STRATEGY, override);
  console.log(`[client] textract → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] textract: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
