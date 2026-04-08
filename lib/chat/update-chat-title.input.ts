import { z } from "zod";
import { FORM_VARIANT_META_KEY } from "@/lib/forms/form-variant";
import { ChatTitleSourceSchema } from "@/lib/validators/enums";

export const UpdateChatTitleInput = z.object({
  chatId: z.string().min(1).max(255).meta({ title: "Chat ID" }),
  title: z.string().trim().min(1).max(120).meta({ title: "Title" }).describe("Display title for the conversation"),
  fileId: z.string().uuid().nullable().optional().meta({ title: "File ID" }).describe("Associated file, if any"),
  source: ChatTitleSourceSchema.default("manual").meta({ title: "Source" }),
}).meta({ [FORM_VARIANT_META_KEY]: "inline" });
export type UpdateChatTitleInput = z.infer<typeof UpdateChatTitleInput>;
