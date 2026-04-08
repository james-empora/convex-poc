import { env } from '@/env';
import type {
  DropboxSignClient,
  CreateEmbeddedSignatureRequestInput,
  SignatureRequestResponse,
  EmbeddedSignUrl,
  CreateUnclaimedDraftInput,
  UnclaimedDraftResponse,
} from './types';

export function createReal(): DropboxSignClient {
  const apiKey = env.DROPBOX_SIGN_API_KEY ?? '';
  const _clientId = env.DROPBOX_SIGN_CLIENT_ID ?? '';
  if (!apiKey) throw new Error('DROPBOX_SIGN_API_KEY required');

  return {
    async createEmbeddedSignatureRequest(_input: CreateEmbeddedSignatureRequestInput): Promise<SignatureRequestResponse> {
      throw new Error('DropboxSignReal not yet implemented');
    },
    async embeddedSignUrl(_signatureId: string): Promise<EmbeddedSignUrl> {
      throw new Error('DropboxSignReal not yet implemented');
    },
    async getSignatureRequest(_id: string): Promise<SignatureRequestResponse> {
      throw new Error('DropboxSignReal not yet implemented');
    },
    async getSignatureRequestFileBody(_id: string): Promise<ArrayBuffer> {
      throw new Error('DropboxSignReal not yet implemented');
    },
    async createUnclaimedDraft(_input: CreateUnclaimedDraftInput): Promise<UnclaimedDraftResponse> {
      throw new Error('DropboxSignReal not yet implemented');
    },
    async cancelSignatureRequest(_id: string): Promise<boolean> {
      throw new Error('DropboxSignReal not yet implemented');
    },
  };
}
