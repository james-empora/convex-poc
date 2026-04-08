export interface BlobGetResult {
  stream: ReadableStream;
  contentType: string;
  size: number;
  etag: string;
}

export interface BlobStorageClient {
  /** Fetch blob content by storage path. Returns null if not found. */
  get(
    storagePath: string,
    opts?: { filetypeHint?: string | null },
  ): Promise<BlobGetResult | null>;
}
