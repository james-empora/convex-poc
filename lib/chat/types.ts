/** A resource that a chat session is scoped to. */
export type ChatResource =
  | { type: "file"; id: string }
  | { type: "ledger"; id: string }
  | { type: "entity"; id: string };
