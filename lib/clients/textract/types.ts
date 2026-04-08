export interface ExtractTextInput {
  s3Bucket: string;
  s3Key: string;
}

export interface ExtractTextResult {
  jobId: string;
  status: 'in_progress' | 'succeeded' | 'failed';
  text?: string;
  pages?: number;
  confidence?: number;
}

export interface TextractClient {
  startExtraction(input: ExtractTextInput): Promise<{ jobId: string }>;
  getJobStatus(jobId: string): Promise<ExtractTextResult>;
}
