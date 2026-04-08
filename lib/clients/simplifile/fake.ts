import { fakeLog } from '../types';
import type { SimplifileClient, Recipient, Instrument, Package } from './types';

const RECIPIENTS_BY_STATE: Record<string, Recipient[]> = {
  TX: [
    { id: 'rec-allen-tx', name: 'Allen', state: 'TX', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-franklin-tx', name: 'Franklin', state: 'TX', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-cooke-tx', name: 'Cooke', state: 'TX', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-travis-tx', name: 'Travis', state: 'TX', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-hays-tx', name: 'Hays', state: 'TX', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-williamson-tx', name: 'Williamson', state: 'TX', status: 'READY_FOR_SUBMISSION' },
  ],
  OH: [
    { id: 'rec-cuyahoga-oh', name: 'Cuyahoga', state: 'OH', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-franklin-oh', name: 'Franklin', state: 'OH', status: 'READY_FOR_SUBMISSION' },
    { id: 'rec-hamilton-oh', name: 'Hamilton', state: 'OH', status: 'READY_FOR_SUBMISSION' },
  ],
};

const INSTRUMENTS: Instrument[] = [
  { recipientId: '', type: 'Affidavit' },
  { recipientId: '', type: 'Deed' },
  { recipientId: '', type: 'Mortgage' },
  { recipientId: '', type: 'Lien Release' },
  { recipientId: '', type: 'Deed of Trust' },
  { recipientId: '', type: 'Assignment' },
];

export function createFake(): SimplifileClient {
  return {
    async recipients(state: string): Promise<Recipient[]> {
      fakeLog('Simplifile', 'recipients', { state });
      return RECIPIENTS_BY_STATE[state.toUpperCase()] ?? [
        { id: `rec-sample-${state.toLowerCase()}`, name: 'Sample', state: state.toUpperCase(), status: 'READY_FOR_SUBMISSION' },
      ];
    },

    async instruments(recipientId: string): Promise<Instrument[]> {
      fakeLog('Simplifile', 'instruments', { recipientId });
      return INSTRUMENTS.map((i) => ({ ...i, recipientId }));
    },

    async createPackage(pkg: Package): Promise<string> {
      fakeLog('Simplifile', 'createPackage', {
        name: pkg.name,
        documents: pkg.documents.length,
        recipientId: pkg.recipientId,
      });
      return 'FAKE-PACKAGE-ID';
    },

    async createViewPackageToken(packageId: string): Promise<string> {
      fakeLog('Simplifile', 'createViewPackageToken', { packageId });
      return 'FAKE-TOKEN';
    },

    async createConsumeTokenUrl(token: string): Promise<string> {
      fakeLog('Simplifile', 'createConsumeTokenUrl', { token });
      return 'https://FAKE-URL';
    },
  };
}
