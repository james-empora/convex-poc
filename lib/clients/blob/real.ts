import { get as blobGet } from "@vercel/blob";
import type { BlobStorageClient } from "./types";

export function createReal(): BlobStorageClient {
  return {
    async get(storagePath) {
      const result = await blobGet(storagePath, {
        access: "private",
        useCache: false,
      });

      if (!result || result.statusCode !== 200) {
        return null;
      }

      return {
        stream: result.stream,
        contentType: result.blob.contentType,
        size: result.blob.size,
        etag: result.blob.etag,
      };
    },
  };
}
