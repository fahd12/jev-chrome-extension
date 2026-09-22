import { loadingVerdict } from '../jev/verdict';
import { hashText, wordCount } from '../shared/hash';
import { loadSettings, onSettingsChanged } from '../shared/settings';
import type {
  AnalyzePostRequest,
  AnalyzePostResponse,
  Platform,
  Settings,
} from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { mountBadge, removeAllBadges, type BadgeController } from './badge';
import { adapterFor, detectPlatform } from './platforms';

/** Skip short reactions; ~20 words as specified, with a small social-feed floor. */
const MIN_WORDS = 12;
let processed = new WeakSet<HTMLElement>();
const badges = new Map<string, BadgeController>();
let postSeq = 0;
let settings: Settings = DEFAULT_SETTINGS;
let observer: MutationObserver | null = null;
let visibility: IntersectionObserver | null = null;

function canAnalyze(next: Settings): boolean {
  return next.enabled && (next.checkAi || next.checkMisinfo);
}

async function analyzePost(
  platform: Platform,
  postId: string,
  text: string,
  author?: string,
): Promise<AnalyzePostResponse> {
  const request: AnalyzePostRequest = {
    type: 'ANALYZE_POST',
    postId,
    platform,
    text,
    author,
  };
  return chrome.runtime.sendMessage(request);
}

function watchPost(
  platform: Platform,
  root: HTMLElement,
  text: string,
  author: string | undefined,
  badge: BadgeController,
): void {
  visibility?.observe(root);
  root.dataset.jevAuthWatch = postIdFor(root, text);
  // Store payload on the element so the intersection callback can send it.
  root.dataset.jevAuthText = text;
  if (author) {
    root.dataset.jevAuthAuthor = author;
  }
  root.dataset.jevAuthPlatform = platform;
  badges.set(root.dataset.jevAuthWatch, badge);
}

function postIdFor(root: HTMLElement, text: string): string {
  if (root.dataset.jevAuthWatch) {
    return root.dataset.jevAuthWatch;
  }
  postSeq += 1;
  return `${hashText(text)}-${postSeq}`;
}

function scan(platform: Platform): void {
  if (!canAnalyze(settings)) {
    return;
  }

  const adapter = adapterFor(platform);
  for (const post of adapter.findPosts()) {
    if (processed.has(post.root)) {
      continue;
    }
    if (wordCount(post.text) < MIN_WORDS) {
      continue;
    }

    processed.add(post.root);
    const badge = mountBadge(post.anchor);
    badge.setVerdict(loadingVerdict());
    watchPost(platform, post.root, post.text, post.author, badge);
  }
}

function startObservers(platform: Platform): void {
  visibility?.disconnect();
  observer?.disconnect();

  visibility = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const root = entry.target as HTMLElement;
        const postId = root.dataset.jevAuthWatch;
        const text = root.dataset.jevAuthText;
        if (!postId || !text || root.dataset.jevAuthSent === '1') {
          return;
        }
        root.dataset.jevAuthSent = '1';
        const badge = badges.get(postId);
        analyzePost(platform, postId, text, root.dataset.jevAuthAuthor)
          .then((response) => {
            badge?.setVerdict(response.verdict);
          })
          .catch((error: unknown) => {
            badge?.setVerdict({
              kind: 'error',
              label: 'Unavailable',
              tone: 'neutral',
              error: error instanceof Error ? error.message : 'Analysis failed.',
            });
          });
      });
    },
    { root: null, threshold: 0.25 },
  );

  observer = new MutationObserver(() => {
    scan(platform);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function stop(): void {
  observer?.disconnect();
  visibility?.disconnect();
  observer = null;
  visibility = null;
  document.querySelectorAll<HTMLElement>('[data-jev-auth-watch]').forEach((el) => {
    delete el.dataset.jevAuthWatch;
    delete el.dataset.jevAuthText;
    delete el.dataset.jevAuthAuthor;
    delete el.dataset.jevAuthPlatform;
    delete el.dataset.jevAuthSent;
  });
  removeAllBadges();
  badges.clear();
  processed = new WeakSet<HTMLElement>();
}

async function boot(): Promise<void> {
  const platform = detectPlatform();
  if (!platform) {
    return;
  }

  settings = await loadSettings();
  if (canAnalyze(settings)) {
    startObservers(platform);
    scan(platform);
  }

  onSettingsChanged((next) => {
    settings = next;
    stop();
    if (canAnalyze(next)) {
      startObservers(platform);
      scan(platform);
    }
  });
}

void boot();
