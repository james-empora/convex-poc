import { fakeLog } from '../types';
import type {
  DropboxSignClient,
  CreateEmbeddedSignatureRequestInput,
  SignatureRequestResponse,
  EmbeddedSignUrl,
  CreateUnclaimedDraftInput,
  UnclaimedDraftResponse,
} from './types';

const FAKE_SIG_REQUEST_ID = '4a87b8351b3eb169b74c219588253290dae41467';

export function createFake(): DropboxSignClient {
  const store = new Map<string, SignatureRequestResponse>();

  return {
    async createEmbeddedSignatureRequest(input: CreateEmbeddedSignatureRequestInput): Promise<SignatureRequestResponse> {
      fakeLog('DropboxSign', 'createEmbeddedSignatureRequest', {
        templateId: input.templateId,
        signers: input.signers.map((s) => s.email),
      });

      const signingUrls: Record<string, string> = {};
      for (const signer of input.signers) {
        signingUrls[signer.email] = `https://app.hellosign.com/sign/fake/${FAKE_SIG_REQUEST_ID}/${encodeURIComponent(signer.email)}`;
      }

      const response: SignatureRequestResponse = {
        signatureRequestId: FAKE_SIG_REQUEST_ID,
        title: `Signature Request for ${input.templateId}`,
        isComplete: false,
        testMode: input.testMode ?? true,
        signingUrls,
        status: 'pending',
      };

      store.set(FAKE_SIG_REQUEST_ID, response);
      return response;
    },

    async embeddedSignUrl(signatureId: string): Promise<EmbeddedSignUrl> {
      fakeLog('DropboxSign', 'embeddedSignUrl', { signatureId });
      return {
        signUrl: `https://app.hellosign.com/editor/embeddedSign?signature_id=${signatureId}&token=fake_token`,
        expiresAt: Date.now() + 3600_000,
      };
    },

    async getSignatureRequest(signatureRequestId: string): Promise<SignatureRequestResponse> {
      fakeLog('DropboxSign', 'getSignatureRequest', { signatureRequestId });
      const existing = store.get(signatureRequestId);
      if (existing) return existing;

      return {
        signatureRequestId,
        title: 'Fake Signature Request',
        isComplete: true,
        testMode: true,
        signingUrls: {},
        status: 'signed',
      };
    },

    async getSignatureRequestFileBody(signatureRequestId: string): Promise<ArrayBuffer> {
      fakeLog('DropboxSign', 'getSignatureRequestFileBody', { signatureRequestId });
      const fakeContent = `%PDF-1.4 fake signed document for ${signatureRequestId}`;
      return new TextEncoder().encode(fakeContent).buffer;
    },

    async createUnclaimedDraft(input: CreateUnclaimedDraftInput): Promise<UnclaimedDraftResponse> {
      fakeLog('DropboxSign', 'createUnclaimedDraft', {
        signers: input.signers.length,
        documents: input.documents.length,
      });
      return {
        claimUrl: 'https://orders.emporatitle.com/test',
        signatureRequestId: FAKE_SIG_REQUEST_ID,
      };
    },

    async cancelSignatureRequest(signatureRequestId: string): Promise<boolean> {
      fakeLog('DropboxSign', 'cancelSignatureRequest', { signatureRequestId });
      store.delete(signatureRequestId);
      return true;
    },
  };
}
