import { evaluatePost, describeJevError } from './jev/client';
import { errorVerdict, mapVerdict, noKeyVerdict } from './jev/verdict';
import { hashText } from './shared/hash';
import { loadSettings } from './shared/settings';
import type {
  AnalyzePostRequest,
  AnalyzePostResponse,
  ExtensionMessage,
  GetSettingsResponse,
  Verdict,
} from './shared/types';

const MAX_CONCURRENT = 2;
const SESSION_CACHE_PREFIX = 'jevCache:';

const memoryCache = new Map<string, Verdict>();
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

function cacheKey(text: string, checkAi: boolean, checkMisinfo: boolean): string {
  return `${hashText(text)}:${checkAi ? 'ai' : '-'}:${checkMisinfo ? 'mis' : '-'}`;
}

async function readSessionCache(key: string): Promise<Verdict | undefined> {
  try {
    const stored = await chrome.storage.session.get(`${SESSION_CACHE_PREFIX}${key}`);
    return stored[`${SESSION_CACHE_PREFIX}${key}`] as Verdict | undefined;
  } catch {
    return undefined;
  }
}

async function writeSessionCache(key: string, verdict: Verdict): Promise<void> {
  try {
    await chrome.storage.session.set({ [`${SESSION_CACHE_PREFIX}${key}`]: verdict });
  } catch {
    // Session storage is best-effort; memory cache still applies.
  }
}

async function analyze(request: AnalyzePostRequest): Promise<AnalyzePostResponse> {
  const settings = await loadSettings();

  if (!settings.apiKey.trim()) {
    return { type: 'ANALYZE_RESULT', postId: request.postId, verdict: noKeyVerdict() };
  }

  if (!settings.enabled || (!settings.checkAi && !settings.checkMisinfo)) {
    return {
      type: 'ANALYZE_RESULT',
      postId: request.postId,
      verdict: errorVerdict('Analysis is turned off in the popup.'),
    };
  }

  const key = cacheKey(request.text, settings.checkAi, settings.checkMisinfo);
  const cached = memoryCache.get(key) ?? (await readSessionCache(key));
  if (cached) {
    memoryCache.set(key, cached);
    return { type: 'ANALYZE_RESULT', postId: request.postId, verdict: cached };
  }

  await acquireSlot();
  try {
    const scores = await evaluatePost(settings.apiKey.trim(), {
      platform: request.platform,
      text: request.text,
      author: request.author,
    });
    const verdict = mapVerdict(scores, settings);
    memoryCache.set(key, verdict);
    await writeSessionCache(key, verdict);
    return { type: 'ANALYZE_RESULT', postId: request.postId, verdict };
  } catch (error) {
    const described = describeJevError(error);
    const verdict =
      described.kind === 'auth' ? noKeyVerdict() : errorVerdict(described.message);
    return { type: 'ANALYZE_RESULT', postId: request.postId, verdict };
  } finally {
    releaseSlot();
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === 'GET_SETTINGS') {
      loadSettings()
        .then((settings) => {
          const response: GetSettingsResponse = { settings };
          sendResponse(response);
        })
        .catch(() => sendResponse({ settings: null }));
      return true;
    }

    if (message.type === 'ANALYZE_POST') {
      analyze(message)
        .then(sendResponse)
        .catch((error: unknown) => {
          const fallback: AnalyzePostResponse = {
            type: 'ANALYZE_RESULT',
            postId: message.postId,
            verdict: errorVerdict(error instanceof Error ? error.message : 'Analysis failed.'),
          };
          sendResponse(fallback);
        });
      return true;
    }

    return false;
  },
);
