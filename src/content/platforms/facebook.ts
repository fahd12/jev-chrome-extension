import type { ExtractedPost, PlatformAdapter } from './types';

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Facebook class names are hashed and change often. Prefer role/dir hooks
 * and skip articles with no readable message body.
 */
export const facebookAdapter: PlatformAdapter = {
  platform: 'facebook',
  findPosts(root = document) {
    const posts: ExtractedPost[] = [];
    const articles = root.querySelectorAll<HTMLElement>('[role="article"]');

    articles.forEach((article) => {
      const message =
        article.querySelector('[data-ad-preview="message"]') ??
        article.querySelector('[data-ad-comet-preview="message"]') ??
        article.querySelector('div[dir="auto"][style*="text-align"]') ??
        article.querySelector('div[dir="auto"]');

      const text = textOf(message);
      if (!text || text.length < 8) {
        return;
      }

      const author =
        textOf(
          article.querySelector('h2 a, h3 a, h4 a, strong a, [role="link"] strong'),
        ) || undefined;

      const anchor =
        (article.querySelector('a[href*="/posts/"], a[href*="story_fbid"], abbr, time') as
          | HTMLElement
          | null) ?? article;

      posts.push({ root: article, text, author, anchor });
    });

    return posts;
  },
};
