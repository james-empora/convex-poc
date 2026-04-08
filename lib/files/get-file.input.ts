import { z } from "zod";
import { FORM_RELATION_META_KEY } from "@/lib/forms/relation";

export const GetFileInput = z.object({
  fileId: z.string().uuid().meta({
    title: "File",
    [FORM_RELATION_META_KEY]: { domain: "files", displayField: "fileNumber" },
  }).describe("The file to retrieve"),
});
export type GetFileInput = z.infer<typeof GetFileInput>;
