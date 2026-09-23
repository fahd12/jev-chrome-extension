/** FNV-1a hash of whitespace-normalized post text, used for cache keys. */
export function hashText(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** Very short posts give an unreliable AI signal, so they are not checked. */
export const MIN_WORDS = 12;

export function isLongEnough(text: string): boolean {
  return wordCount(text) >= MIN_WORDS;
}
