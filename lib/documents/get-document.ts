export type DocumentDetail = {
  id: string;
  name: string;
  documentType?: string | null;
  filetype: string | null;
  storagePath: string;
  fileSizeBytes: number | null;
  createdAt: string;
  fileId: string | null;
};
