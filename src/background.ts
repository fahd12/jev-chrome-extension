import { chromeSessionStorage, createVerdictCache } from './detector/cache';
import { getDetector } from './detector';
import { describeJevError } from './jev/client';
import { hashText } from './shared/hash';
import { loadSettings } from './shared/settings';
import { onStatsChanged, readStats, recordCheck } from './shared/stats';
import type { CheckPostResponse, ExtensionMessage, SlopStats } from './shared/types';

const MAX_CONCURRENT = 2;

const cache = createVerdictCache(chromeSessionStorage());
let active = 0;
const waiters: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => {
      waiters.push(resolve);
    });
  }
  active += 1;
}

function releaseSlot(): void {
  active = Math.max(0, active - 1);
  const next = waiters.shift();
  next?.();
}

// ── #11: Toolbar badge count ────────────────────────────────────────────

function updateBadge(stats: SlopStats): void {
  const count = stats.marked;
  const text = count > 0 ? String(count) : '';
  chrome.action.setBadgeText({ text }).catch(() => {});
  if (count > 0) {
    chrome.action.setBadgeBackgroundColor({ color: '#DC2626' }).catch(() => {});
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' }).catch(() => {});
  }
}

// Sync badge on startup and whenever stats change.
void readStats().then(updateBadge);
onStatsChanged(updateBadge);

// ── Post check ──────────────────────────────────────────────────────────

async function checkPost(text: string): Promise<CheckPostResponse> {
  const settings = await loadSettings();
  if (!settings.enabled) {
    return { slop: false };
  }

  const key = hashText(text);
  const cached = await cache.get(key);
  if (cached !== undefined) {
    return { slop: cached };
  }

  await acquireSlot();
  try {
    const slop = await getDetector(settings)(text);
    await cache.set(key, slop);
    await recordCheck(slop).catch((error: unknown) => {
      console.warn('Slop stats update failed', error);
    });
    return { slop };
  } finally {
    releaseSlot();
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type !== 'CHECK_POST') {
      return false;
    }

    checkPost(message.text)
      .then(sendResponse)
      .catch((error: unknown) => {
        const response: CheckPostResponse = {
          slop: false,
          error: describeJevError(error).message,
        };
        sendResponse(response);
      });
    return true;
  },
);
