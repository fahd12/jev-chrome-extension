import { hashText, isLongEnough } from '../shared/hash';
import { loadSettings, onSettingsChanged } from '../shared/settings';
import type { CheckPostRequest, CheckPostResponse, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { addBanner, hasBanner, removeAllBanners, removeBanner } from './banner';
import { findPosts, isThreadPage, type ExtractedPost } from './x';

const HASH_ATTR = 'data-slop-hash';

/** Known results by text hash: true = slop, false = not slop. */
const results = new Map<string, boolean>();
const inFlight = new Set<string>();
let texts = new WeakMap<HTMLElement, string>();
let settings: Settings = DEFAULT_SETTINGS;
let observer: MutationObserver | null = null;
let visibility: IntersectionObserver | null = null;
let scanQueued = false;

async function checkPost(text: string): Promise<CheckPostResponse> {
  const request: CheckPostRequest = { type: 'CHECK_POST', text };
  return chrome.runtime.sendMessage(request);
}

function applyResult(hash: string): void {
  if (results.get(hash) !== true) {
    return;
  }
  document.querySelectorAll<HTMLElement>(`[${HASH_ATTR}="${hash}"]`).forEach(addBanner);
}

function requestCheck(hash: string, text: string): void {
  if (inFlight.has(hash) || results.has(hash)) {
    return;
  }
  inFlight.add(hash);
  checkPost(text)
    .then((response) => {
      if (response.error) {
        console.warn('[AI slop]', response.error);
        return;
      }
      results.set(hash, response.slop);
      if (settings.enabled) {
        applyResult(hash);
      }
    })
    .catch((error: unknown) => {
      console.warn('[AI slop]', error instanceof Error ? error.message : error);
    })
    .finally(() => {
      inFlight.delete(hash);
    });
}

function onVisible(entries: IntersectionObserverEntry[]): void {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }
    const root = entry.target as HTMLElement;
    visibility?.unobserve(root);
    const hash = root.getAttribute(HASH_ATTR);
    const text = texts.get(root);
    if (hash && text) {
      requestCheck(hash, text);
    }
  });
}

function track(post: ExtractedPost): void {
  if (!isLongEnough(post.text)) {
    return;
  }
  const { root, text } = post;
  const hash = hashText(text);
  const stored = root.getAttribute(HASH_ATTR);

  if (stored === hash) {
    if (results.get(hash) === true && !hasBanner(root)) {
      addBanner(root);
    }
    return;
  }

  if (stored) {
    removeBanner(root);
  }
  root.setAttribute(HASH_ATTR, hash);
  texts.set(root, text);

  if (results.has(hash)) {
    applyResult(hash);
  } else {
    visibility?.observe(root);
  }
}

function scan(): void {
  scanQueued = false;
  if (!settings.enabled || isThreadPage(location.pathname)) {
    return;
  }
  findPosts().forEach(track);
}

/** Collapse bursts of mutations into one scan per frame. */
function scheduleScan(): void {
  if (scanQueued) {
    return;
  }
  scanQueued = true;
  requestAnimationFrame(scan);
}

function start(): void {
  visibility = new IntersectionObserver(onVisible, { root: null, threshold: 0.25 });
  observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
}

function stop(): void {
  observer?.disconnect();
  visibility?.disconnect();
  observer = null;
  visibility = null;
  scanQueued = false;
  document.querySelectorAll(`[${HASH_ATTR}]`).forEach((el) => el.removeAttribute(HASH_ATTR));
  removeAllBanners();
  texts = new WeakMap<HTMLElement, string>();
}

async function boot(): Promise<void> {
  settings = await loadSettings();
  if (settings.enabled) {
    start();
  }

  onSettingsChanged((next) => {
    settings = next;
    stop();
    if (next.enabled) {
      start();
    }
  });
}

void boot();
