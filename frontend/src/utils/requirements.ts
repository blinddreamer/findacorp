/**
 * Corp requirements are stored as a JSON list of strings (e.g. "SP: 10,000,000").
 * Whether a requirement is optional rather than mandatory is encoded with a trailing
 * "(optional)" marker on the stored string. A requirement without the marker is
 * mandatory — so existing data (and anything that ignores the marker) stays correct.
 */

export interface ParsedRequirement {
  /** The requirement text, e.g. "SP: 10,000,000" — without the optional marker. */
  text: string;
  /** True when the requirement is nice-to-have rather than mandatory. */
  optional: boolean;
}

const OPTIONAL_RE = /^(.*?)\s*\(optional\)\s*$/i;

/** Split a stored requirement string into its text and optional flag. */
export function parseRequirement(line: string): ParsedRequirement {
  const m = line.match(OPTIONAL_RE);
  if (m) return { text: m[1], optional: true };
  return { text: line, optional: false };
}

/** Encode requirement text + optional flag back into a single stored string. */
export function formatRequirement(text: string, optional: boolean): string {
  return optional ? `${text} (optional)` : text;
}

/** Split a "Label: value" requirement text into its label and value parts. */
export function splitRequirement(text: string): { label: string; value: string } {
  const idx = text.indexOf(':');
  if (idx === -1) return { label: text.trim(), value: '' };
  return { label: text.slice(0, idx).trim(), value: text.slice(idx + 1).trim() };
}
