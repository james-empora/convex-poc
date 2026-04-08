import { get } from "@vercel/blob";
import { requireUser } from "@/lib/auth/get-user";
import { createAuthenticatedConvexHttpClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";

const CONTENT_TYPE_BY_FILETYPE: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  tiff: "image/tiff",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function encodeFilename(filename: string) {
  return encodeURIComponent(filename).replace(/['()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function buildContentDisposition(filename: string, shouldDownload: boolean) {
  const safeFilename = filename.replace(/\"/g, "");
  const type = shouldDownload ? "attachment" : "inline";
  return `${type}; filename="${safeFilename}"; filename*=UTF-8''${encodeFilename(filename)}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ documentId: string }> | { documentId: string } },
) {
  try {
    const user = await requireUser();
    const { documentId } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId)) {
      return new Response("Invalid document ID", { status: 400 });
    }
    const url = new URL(request.url);
    const shouldDownload = url.searchParams.get("download") === "1";

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const convex = await createAuthenticatedConvexHttpClient();
    const doc = await convex.query(api.documents.getDocument, { documentId }).catch(() => null);
    if (!doc) {
      return new Response("Document not found", { status: 404 });
    }
    const blobResult = await get(doc.storagePath, {
      access: "private",
      useCache: false,
    });

    if (!blobResult || blobResult.statusCode !== 200) {
      return new Response("Document content unavailable", { status: 404 });
    }

    const contentType =
      blobResult.blob.contentType ||
      (doc.filetype ? CONTENT_TYPE_BY_FILETYPE[doc.filetype] : undefined) ||
      "application/octet-stream";

    return new Response(blobResult.stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(blobResult.blob.size),
        "Cache-Control": "private, no-store, max-age=0",
        ETag: blobResult.blob.etag,
        "Content-Disposition": buildContentDisposition(doc.name, shouldDownload),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Not authenticated") {
      return new Response("Unauthorized", { status: 401 });
    }

    console.error("[document-content]", error);
    return new Response("Failed to load document", { status: 500 });
  }
}
