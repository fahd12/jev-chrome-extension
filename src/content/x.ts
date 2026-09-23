export type ExtractedPost = { root: HTMLElement; text: string };

const ARTICLE_SELECTOR = 'article[data-testid="tweet"]';
const TEXT_SELECTOR = '[data-testid="tweetText"]';
const QUOTE_SELECTOR = 'div[role="link"]';
const THREAD_PATH = /^\/[^/]+\/status\/\d+/;

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The quote container that holds this tweetText, if it sits inside the article. */
function quoteFor(textEl: Element, article: Element): HTMLElement | null {
  const quote = textEl.closest<HTMLElement>(QUOTE_SELECTOR);
  return quote && quote !== article && article.contains(quote) ? quote : null;
}

function partsOf(article: HTMLElement): ExtractedPost[] {
  const parts: ExtractedPost[] = [];
  article.querySelectorAll(TEXT_SELECTOR).forEach((textEl) => {
    const text = textOf(textEl);
    if (!text) {
      return;
    }
    const root = quoteFor(textEl, article) ?? article;
    if (!parts.some((part) => part.root === root)) {
      parts.push({ root, text });
    }
  });
  return parts;
}

/** X posts (outer text and quoted text as separate parts). */
export function findPosts(root: ParentNode = document): ExtractedPost[] {
  const posts: ExtractedPost[] = [];
  root.querySelectorAll<HTMLElement>(ARTICLE_SELECTOR).forEach((article) => {
    posts.push(...partsOf(article));
  });
  return posts;
}

/** Thread detail pages (/user/status/123) are out of scope. */
export function isThreadPage(pathname: string): boolean {
  return THREAD_PATH.test(pathname);
}
