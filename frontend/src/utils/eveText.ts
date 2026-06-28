/**
 * EVE character descriptions (from ESI) arrive wrapped in EVE's rich-text markup —
 * <font> tags, <br> line breaks, and showinfo: links — and sometimes with unicode
 * escapes (…) or a Python-style u'...' string wrapper. Convert all of that into
 * clean, readable plain text for display.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

export function cleanEveBio(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw.trim();

  // Unwrap a Python-style unicode repr wrapper: u'...' or u"..."
  const wrapped = s.match(/^u(['"])([\s\S]*)\1$/);
  if (wrapped) s = wrapped[2];

  // Decode \uXXXX escapes and common backslash escapes.
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '').replace(/\\(['"\\])/g, '$1');

  // EVE markup -> text.
  s = s.replace(/<br\s*\/?>/gi, '\n');                // line breaks
  s = s.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1'); // keep link label, drop showinfo href
  s = s.replace(/<\/?[^>]+>/g, '');                   // strip remaining tags (font, etc.)

  // Decode HTML entities (named + numeric).
  s = s.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, m => HTML_ENTITIES[m] ?? m);
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));

  // Tidy whitespace: drop trailing spaces per line, collapse 3+ blank lines to one.
  return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
