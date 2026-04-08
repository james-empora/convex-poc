import { fakeLog } from '../types';
import type { TextractClient, ExtractTextInput, ExtractTextResult } from './types';

const FAKE_OCR_TEXT = `DEED OF TRUST

This Deed of Trust ("Security Instrument") is made on January 15, 2025.
The trustor is JOHN DOE and JANE DOE, husband and wife ("Borrower").
The trustee is EMPORA TITLE COMPANY, a Texas corporation ("Trustee").
The beneficiary is FIRST NATIONAL BANK ("Lender").

Property Address: 123 Main Street, Austin, TX 78701
Legal Description: Lot 14, Block 3, Subdivision of Elm Heights, Travis County, Texas.
Parcel Number: 1234567890

The loan amount secured by this instrument is $450,000.00.
Interest rate: 6.875% per annum.
Maturity date: February 1, 2055.

BORROWER'S TRANSFER TO TRUSTEE. Borrower irrevocably grants and conveys to Trustee,
in trust, with power of sale, the Property described above.`;

export function createFake(): TextractClient {
  const jobStore = new Map<string, ExtractTextResult>();
  let jobCounter = 1;

  return {
    async startExtraction(input: ExtractTextInput): Promise<{ jobId: string }> {
      fakeLog('Textract', 'startExtraction', { bucket: input.s3Bucket, key: input.s3Key });
      const jobId = `textract-fake-job-${Date.now()}-${jobCounter++}`;

      jobStore.set(jobId, { jobId, status: 'in_progress' });

      // Simulate async completion
      setTimeout(() => {
        jobStore.set(jobId, {
          jobId,
          status: 'succeeded',
          text: FAKE_OCR_TEXT,
          pages: 3,
          confidence: 99.2,
        });
      }, 1500);

      return { jobId };
    },

    async getJobStatus(jobId: string): Promise<ExtractTextResult> {
      fakeLog('Textract', 'getJobStatus', { jobId });
      return jobStore.get(jobId) ?? { jobId, status: 'succeeded', text: FAKE_OCR_TEXT, pages: 3, confidence: 99.2 };
    },
  };
}
