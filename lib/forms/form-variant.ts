import type { z } from "zod";
import type { ResourceCardVariant } from "./resource-card";

export const FormVariant: unique symbol = Symbol.for("app/FormVariant");
export const FORM_VARIANT_META_KEY = "formVariant";

export function getFormVariant(
  schema: z.ZodTypeAny,
): ResourceCardVariant | undefined {
  const meta = schema.meta();
  if (meta?.formVariant) return meta.formVariant as ResourceCardVariant;
  const legacyMeta = meta as Record<PropertyKey, unknown> | undefined;
  if (legacyMeta && FormVariant in legacyMeta) {
    return legacyMeta[FormVariant] as ResourceCardVariant;
  }
  return undefined;
}
