export type FileDocumentSummary = {
  id: string;
  name: string;
  documentType: string;
  filetype: string | null;
  storagePath: string;
  fileSizeBytes: number | null;
  pageCount?: number | null;
  origin?: string | null;
  createdAt: string;
};
