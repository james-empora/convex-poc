/**
 * Relation metadata used by Zod-backed form schemas.
 *
 * New schemas should attach this via `.meta({ formRelation: ... })`.
 * The symbol export remains so older schemas can continue annotating relation fields.
 */
export const FormRelation: unique symbol = Symbol.for(
  "app/FormRelation",
);
export const FORM_RELATION_META_KEY = "formRelation";

export interface FormRelationConfig {
  /** Domain name that maps to a search provider (e.g. "entities", "files") */
  domain: string;
  /** Which field on the search result to display in the combobox (default: "name") */
  displayField?: string;
  /** Optional secondary field shown as muted text (e.g. "email") */
  secondaryField?: string;
}

/** Type-safe helper to create the annotation entry */
export function formRelation(config: FormRelationConfig) {
  return { [FormRelation]: config } as Record<symbol, FormRelationConfig>;
}
