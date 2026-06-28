import { describe, it, expect } from 'vitest';
import { cleanEveBio } from './eveText';

describe('cleanEveBio', () => {
  it('cleans the real EVE bio example (wrapper, escape, font + link tags)', () => {
    const raw = `u'<font size="14" color="#bfffffff">"Just helping the miners relax by lightening their load\\u2026"<br><br></font><font size="14" color="#ffd98d00"><a href="showinfo:1384//93774683">Blind Dreamer</a></font>'`;
    expect(cleanEveBio(raw)).toBe('"Just helping the miners relax by lightening their load…"\n\nBlind Dreamer');
  });

  it('strips font tags but keeps the text', () => {
    expect(cleanEveBio('<font size="12" color="#ffffffff">Hello pilot</font>')).toBe('Hello pilot');
  });

  it('keeps link label and drops the showinfo href', () => {
    expect(cleanEveBio('Fly with <a href="showinfo:16159//99003581">Goonswarm</a>')).toBe('Fly with Goonswarm');
  });

  it('converts <br> to newlines', () => {
    expect(cleanEveBio('Line one<br>Line two<br/>Line three')).toBe('Line one\nLine two\nLine three');
  });

  it('decodes HTML entities', () => {
    expect(cleanEveBio('Tackle &amp; hold &lt;3')).toBe('Tackle & hold <3');
  });

  it('returns empty string for nullish input', () => {
    expect(cleanEveBio(null)).toBe('');
    expect(cleanEveBio(undefined)).toBe('');
    expect(cleanEveBio('')).toBe('');
  });
});
