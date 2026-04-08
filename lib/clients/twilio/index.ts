import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { TwilioClient } from './types';

export function createTwilioClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.TWILIO_STRATEGY, override);
  console.log(`[client] twilio → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] twilio: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
