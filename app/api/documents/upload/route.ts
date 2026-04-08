import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Client upload token endpoint for Vercel Blob.
 *
 * The client calls `upload()` from `@vercel/blob/client` which hits this
 * route to obtain a short-lived token, then streams the file directly to
 * Blob storage — bypassing the 4.5 MB server action payload limit.
 *
 * DB record creation and workflow triggering happen separately via the
 * `registerUploadedDocument` server action after the upload completes.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/tiff",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      maximumSizeInBytes: 50 * 1024 * 1024, // 50 MB
      addRandomSuffix: true,
    }),
  });

  return NextResponse.json(jsonResponse);
}
