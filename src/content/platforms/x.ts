import type { ExtractedPost, PlatformAdapter } from './types';

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * X/Twitter: articles keep a relatively stable data-testid contract
 * even as class names churn.
 */
export const xAdapter: PlatformAdapter = {
  platform: 'x',
  findPosts(root = document) {
    const posts: ExtractedPost[] = [];
    const articles = root.querySelectorAll<HTMLElement>('article[data-testid="tweet"]');

    articles.forEach((article) => {
      const textEl = article.querySelector('[data-testid="tweetText"]');
      const text = textOf(textEl);
      if (!text) {
        return;
      }

      const author =
        textOf(article.querySelector('[data-testid="User-Name"] span')) || undefined;
      const time = article.querySelector('time');
      const anchor = (time?.parentElement as HTMLElement | null) ?? article;

      posts.push({ root: article, text, author, anchor });
    });

    return posts;
  },
};
