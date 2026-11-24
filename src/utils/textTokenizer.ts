export const TEXT_SEPARATOR_REGEX = /(\s+|[.,!?;:()"“”‘/[\]—–…]+|’(?=\s|$|[.,!?;:()"“”/[\]—–…]))/;
const WORD_TOKEN_REGEX = /^[a-zA-Z0-9'’-]+$/;

/**
 * Strips edge punctuation from a token and normalizes curly apostrophes (`’`) to ASCII (`'`)
 * for dictionary lookup.
 */
export function normalizeClickableToken(token: string): string {
  return token
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .replace(/’/g, "'");
}

/**
 * Splits a text segment into ordered tokens indicating which pieces represent clickable English words.
 */
export function tokenizeClickableSegment(segment: string): Array<{
  raw: string;
  lookupWord: string | null;
}> {
  if (!segment) return [];
  return segment.split(TEXT_SEPARATOR_REGEX).filter(Boolean).map((raw) => {
    if (!WORD_TOKEN_REGEX.test(raw)) {
      return { raw, lookupWord: null };
    }
    const clean = normalizeClickableToken(raw);
    return {
      raw,
      lookupWord: clean || null,
    };
  });
}

/**
 * Determines whether a heading contains multiple distinct whitespace-separated words
 * so individual constituent words can be clicked independently.
 */
export function isMultiWordHeading(heading: string): boolean {
  return heading.trim().split(/\s+/).filter(Boolean).length > 1;
}
