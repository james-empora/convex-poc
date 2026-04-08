export interface Signer {
  name: string;
  email: string;
  role: string;
}

export interface CreateEmbeddedSignatureRequestInput {
  templateId: string;
  testMode?: boolean;
  signers: Signer[];
  customFields?: Record<string, string>;
}

export interface SignatureRequestResponse {
  signatureRequestId: string;
  title: string;
  isComplete: boolean;
  testMode: boolean;
  signingUrls: Record<string, string>; // email → signing URL
  status: 'pending' | 'signed' | 'declined';
}

export interface EmbeddedSignUrl {
  signUrl: string;
  expiresAt: number;
}

export interface UnclaimedDraftResponse {
  claimUrl: string;
  signatureRequestId?: string;
}

export interface CreateUnclaimedDraftInput {
  signers: Signer[];
  documents: Array<{ name: string; fileUrl: string }>;
  requesterEmailAddress?: string;
  testMode?: boolean;
}

export interface DropboxSignClient {
  createEmbeddedSignatureRequest(input: CreateEmbeddedSignatureRequestInput): Promise<SignatureRequestResponse>;
  embeddedSignUrl(signatureId: string): Promise<EmbeddedSignUrl>;
  getSignatureRequest(signatureRequestId: string): Promise<SignatureRequestResponse>;
  getSignatureRequestFileBody(signatureRequestId: string): Promise<ArrayBuffer>;
  createUnclaimedDraft(input: CreateUnclaimedDraftInput): Promise<UnclaimedDraftResponse>;
  cancelSignatureRequest(signatureRequestId: string): Promise<boolean>;
}
