import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { SendGridClient } from './types';

export function createSendGridClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.SENDGRID_STRATEGY, override);
  console.log(`[client] sendgrid → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] sendgrid: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
