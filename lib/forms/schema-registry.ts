import type { z } from "zod";

import { CreateEntityInput } from "@/lib/entities/create-entity.input";
import { SearchEntitiesInput } from "@/lib/entities/search-entities.input";
import { AddFilePartyInput } from "@/lib/files/add-file-party.input";
import { GetFileInput } from "@/lib/files/get-file.input";
import { OpenFileInput } from "@/lib/files/open-file.input";
import { RegisterClientUploadInput } from "@/lib/documents/register-client-upload.input";
import { UpdateChatTitleInput } from "@/lib/chat/update-chat-title.input";

export interface SchemaRegistryEntry {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
}

export const SCHEMA_REGISTRY: SchemaRegistryEntry[] = [
  {
    name: "Create Entity",
    description: "Create an individual, organization, brokerage, or lender",
    schema: CreateEntityInput,
  },
  {
    name: "Search Entities",
    description: "Search for entities by name or email",
    schema: SearchEntitiesInput,
  },
  {
    name: "Add File Party",
    description: "Add a party (buyer, seller, agent, etc.) to a file",
    schema: AddFilePartyInput,
  },
  {
    name: "Get File",
    description: "Retrieve a file by ID",
    schema: GetFileInput,
  },
  {
    name: "Open File",
    description: "Open a new title or escrow file",
    schema: OpenFileInput,
  },
  {
    name: "Register Document Upload",
    description: "Register a document that was uploaded to blob storage",
    schema: RegisterClientUploadInput,
  },
  {
    name: "Update Chat Title",
    description: "Update the title of a chat conversation",
    schema: UpdateChatTitleInput,
  },
];

export function getSchemaByName(
  name: string,
): SchemaRegistryEntry | undefined {
  return SCHEMA_REGISTRY.find((e) => e.name === name);
}
