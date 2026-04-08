import type { UIMessage } from "ai";
import type { AppUser } from "@/lib/auth/permissions";

export interface UploadedFileInfo {
  name: string;
  url: string;
  filetype: string;
  size: number;
}

export interface ChatStreamOptions {
  messages: UIMessage[];
  fileId?: string | null;
  model?: string;
  uploadedFiles?: UploadedFileInfo[];
  chatId?: string;
  user: AppUser | null;
  requestUrl: string;
}

export interface ChatService {
  /** Generate a streaming chat response. */
  streamResponse(opts: ChatStreamOptions): Promise<Response>;
}
