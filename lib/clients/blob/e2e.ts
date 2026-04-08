import type { BlobStorageClient } from "./types";

function buildFakeContent(filetype: string | null): Uint8Array {
  if (filetype === "pdf") {
    return new TextEncoder().encode(
      "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF",
    );
  }

  if (filetype === "png" || filetype === "jpg" || filetype === "tiff") {
    return Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);
  }

  return new TextEncoder().encode("Mock document content");
}

export function createE2E(): BlobStorageClient {
  return {
    async get(_storagePath, opts) {
      const content = buildFakeContent(opts?.filetypeHint ?? null);

      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue(content);
            controller.close();
          },
        }),
        contentType: "application/octet-stream",
        size: content.byteLength,
        etag: `"e2e-${Date.now()}"`,
      };
    },
  };
}
