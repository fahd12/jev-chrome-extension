import type { ExtractedPost, PlatformAdapter } from './types';

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function firstText(root: Element, selectors: string[]): string {
  for (const selector of selectors) {
    const value = textOf(root.querySelector(selector));
    if (value) {
      return value;
    }
  }
  return '';
}

/**
 * LinkedIn feed cards keep a fairly stable `feed-shared-update-v2` wrapper.
 * Text lives in a few description containers that rotate names over time.
 */
export const linkedinAdapter: PlatformAdapter = {
  platform: 'linkedin',
  findPosts(root = document) {
    const posts: ExtractedPost[] = [];
    const cards = root.querySelectorAll<HTMLElement>(
      'div.feed-shared-update-v2, div.feed-shared-update, article.feed-shared-update-v2',
    );

    cards.forEach((card) => {
      const text = firstText(card, [
        '.update-components-text',
        '.feed-shared-update-v2__description',
        '.feed-shared-text',
        '.feed-shared-inline-show-more-text',
        '[data-test-id="main-feed-activity-card__commentary"]',
      ]);
      if (!text) {
        return;
      }

      const author =
        firstText(card, [
          '.update-components-actor__name',
          '.update-components-actor__title',
          '.feed-shared-actor__name',
        ]) || undefined;

      const anchor =
        (card.querySelector(
          '.update-components-actor__sub-description, .feed-shared-actor__sub-description, time',
        ) as HTMLElement | null) ?? card;

      posts.push({ root: card, text, author, anchor });
    });

    return posts;
  },
};
