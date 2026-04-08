import { upload } from "@vercel/blob/client";

async function realUpload(file: File) {
  return upload(file.name, file, {
    access: "private",
    handleUploadUrl: "/api/documents/upload",
    multipart: true,
  });
}

async function e2eUpload(file: File) {
  return { url: `e2e://upload/${encodeURIComponent(file.name)}` };
}

export const uploadDocumentClient =
  process.env.NEXT_PUBLIC_E2E_TEST_MODE === "true" ? e2eUpload : realUpload;
