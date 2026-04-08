import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { buildE2EChatText } from "@/lib/e2e/fixtures";
import type { ChatService } from "./types";

export function createE2E(): ChatService {
  return {
    async streamResponse({ messages, fileId, uploadedFiles }) {
      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          writer.write({ type: "start" });
          writer.write({ type: "text-start", id: "text-1" });
          writer.write({
            type: "text-delta",
            id: "text-1",
            delta: buildE2EChatText({ fileId, uploadedFiles }),
          });
          writer.write({ type: "text-end", id: "text-1" });

          if (uploadedFiles && uploadedFiles.length > 0) {
            writer.write({
              type: "tool-input-available",
              toolCallId: "tool-1",
              toolName: "register_document",
              input: { name: uploadedFiles[0].name },
            });
            writer.write({
              type: "tool-output-available",
              toolCallId: "tool-1",
              output: { extractionTriggered: true },
            });
          } else {
            writer.write({
              type: "tool-input-available",
              toolCallId: "tool-1",
              toolName: "open_file",
              input: {
                addressLine1: "123 Test St",
                city: "Austin",
                state: "TX",
              },
            });
            writer.write({
              type: "tool-output-available",
              toolCallId: "tool-1",
              output: { address: "123 Test St" },
            });
          }

          writer.write({ type: "finish", finishReason: "stop" });
        },
        originalMessages: messages,
      });

      return createUIMessageStreamResponse({ stream });
    },
  };
}
