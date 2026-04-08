import { resolveStrategy, type ClientStrategy } from '../types';
import { createFake } from './fake';
import { createReal } from './real';
import { env } from '@/env';
export type { DropboxSignClient } from './types';

export function createDropboxSignClient(override?: ClientStrategy) {
  const strategy = resolveStrategy(env.DROPBOX_SIGN_STRATEGY, override);
  console.log(`[client] dropbox-sign → ${strategy}`);
  switch (strategy) {
    case 'real':
      return createReal();
    case 'local':
      console.log(`[client] dropbox-sign: local not implemented, using fake`);
      return createFake();
    case 'fake':
    default:
      return createFake();
  }
}
