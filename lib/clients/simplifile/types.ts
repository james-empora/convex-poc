export interface Recipient {
  id: string;
  name: string; // county name (without " County" suffix)
  state: string;
  status: 'READY_FOR_SUBMISSION' | 'RECIPIENT_NOT_AVAILABLE_FOR_ERECORD';
}

export interface Instrument {
  recipientId: string;
  type: string; // e.g., 'Affidavit', 'Deed', 'Mortgage'
}

export interface Document {
  name: string;
  fileBytes: string[]; // base64 encoded pages
  kindOfInstrument: string[];
  submitterDocumentId?: string;
}

export interface Package {
  name: string;
  documents: Document[];
  recipientId: string;
  submitterPackageId?: string;
}

export type PackageStatusValue =
  | 'ABORTED' | 'ACCEPTED' | 'BILLED_REJECTED' | 'CANCELLED'
  | 'DELAYED_PENDING_SUBMISSION' | 'DRAFT' | 'HELD_FOR_PAYMENT'
  | 'NEEDS_ATTENTION' | 'PENDING_REVIEW' | 'PROCESSING'
  | 'READY_FOR_SUBMISSION' | 'RECORDED' | 'RECORDING_FEES_CALCULATED'
  | 'REJECTED' | 'REJECTED_WITH_CORRECTIONS' | 'SUBMITTED'
  | 'UNDER_REVIEW' | 'WAITING_FOR_RECORDING_INFORMATION';

export interface PackageStatus {
  status: PackageStatusValue;
  submitterPackageId?: string;
}

export interface SimplifileClient {
  recipients(state: string): Promise<Recipient[]>;
  instruments(recipientId: string): Promise<Instrument[]>;
  createPackage(pkg: Package): Promise<string>; // returns package ID
  createViewPackageToken(packageId: string): Promise<string>;
  createConsumeTokenUrl(token: string): Promise<string>;
}
