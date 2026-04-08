import type { ComboboxOption } from "@/components/ui/combobox";

/**
 * A search provider supplies async search for a domain (e.g. "entities", "files").
 * Registered providers are used by DynamicForm to render searchable comboboxes
 * for fields annotated with FormRelation.
 */
export interface SearchProvider {
  /** Async search — called as the user types in the combobox */
  search: (query: string) => Promise<ComboboxOption[]>;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Message shown when no results match */
  emptyMessage?: string;
}

export type SearchProviderMap = Record<string, SearchProvider>;
