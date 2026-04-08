import type { TextractClient, ExtractTextInput, ExtractTextResult } from './types';

export function createReal(): TextractClient {
  return {
    async startExtraction(_input: ExtractTextInput): Promise<{ jobId: string }> {
      throw new Error('TextractReal not yet implemented');
    },
    async getJobStatus(_jobId: string): Promise<ExtractTextResult> {
      throw new Error('TextractReal not yet implemented');
    },
  };
}
