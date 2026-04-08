import { isE2ETestMode } from "@/lib/e2e/mode";
import { createReal } from "./real";
import { createE2E } from "./e2e";

export type { ChatService, ChatStreamOptions, UploadedFileInfo } from "./types";

export function createChatService() {
  if (isE2ETestMode()) return createE2E();
  return createReal();
}
