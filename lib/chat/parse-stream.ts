/**
 * Parse an NDJSON stream from the chat API into text and permission events.
 */

export interface StreamTextEvent {
  type: 'text';
  content: string;
}

export interface StreamPermissionEvent {
  type: 'permission';
  id: string;
  title: string;
  toolName: string;
  displayName?: string;
  description?: string;
  input?: Record<string, unknown>;
  suggestions?: Array<{ type: string; rules?: Array<{ toolName: string; ruleContent: string }>; behavior?: string; destination?: string }>;
}

export type StreamEvent = StreamTextEvent | StreamPermissionEvent;

/**
 * Read an NDJSON response body, calling handlers for each event type.
 *
 * `onTextDelta` receives individual text chunks (not accumulated).
 * The caller is responsible for accumulation and message management.
 */
export async function consumeChatStream(
  body: ReadableStream<Uint8Array>,
  handlers: {
    onTextDelta: (delta: string) => void;
    onPermission: (event: StreamPermissionEvent) => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event: StreamEvent = JSON.parse(line);
          if (event.type === 'text') {
            handlers.onTextDelta(event.content);
          } else if (event.type === 'permission') {
            handlers.onPermission(event);
          }
        } catch {
          // Not valid JSON — treat as plain text
          handlers.onTextDelta(line);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
