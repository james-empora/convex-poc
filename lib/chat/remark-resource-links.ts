/**
 * Pre-processes markdown content to transform @file:ID{Label} and @doc:ID{Label}
 * syntax into standard markdown links with empora:// URLs.
 *
 * These are then rendered as interactive ResourceLink components by the
 * markdown renderer's `a` component override.
 */

const RESOURCE_REF_PATTERN = /@(file|doc):([a-zA-Z0-9_-]+)\{([^}]+)\}/g;

/**
 * Replace resource reference syntax with markdown links.
 *
 * `@file:abc123{742 Evergreen Terrace}` → `[742 Evergreen Terrace](empora://file/abc123)`
 * `@doc:xyz456{Purchase Agreement}` → `[Purchase Agreement](empora://doc/xyz456)`
 */
export function transformResourceRefs(content: string): string {
  return content.replace(
    RESOURCE_REF_PATTERN,
    (_match, type, id, label) => `[${label}](empora://${type}/${id})`,
  );
}
