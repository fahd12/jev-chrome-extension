import { chromeSessionStorage, createVerdictCache } from './detector/cache';
import { getDetector } from './detector';
import { describeJevError } from './jev/client';
import { hashText } from './shared/hash';
import { loadSettings } from './shared/settings';
import { recordCheck } from './shared/stats';
import type { CheckPostResponse, ExtensionMessage } from './shared/types';

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
