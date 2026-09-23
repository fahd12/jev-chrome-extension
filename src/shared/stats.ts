import type { SlopStats } from './types';

export const STATS_KEY = 'slopStats';

const EMPTY_STATS: SlopStats = { checked: 0, marked: 0 };

let queue: Promise<void> = Promise.resolve();

function toStats(value: Partial<SlopStats> | undefined): SlopStats {
  return { ...EMPTY_STATS, ...value };
}

export async function readStats(): Promise<SlopStats> {
  const stored = await chrome.storage.session.get(STATS_KEY);
  return toStats(stored[STATS_KEY] as Partial<SlopStats> | undefined);
}

async function increment(slop: boolean): Promise<void> {
  const current = await readStats();
  const next: SlopStats = {
    checked: current.checked + 1,
    marked: current.marked + (slop ? 1 : 0),
  };
  await chrome.storage.session.set({ [STATS_KEY]: next });
}

/** Serialized so parallel checks do not lose increments. */
export function recordCheck(slop: boolean): Promise<void> {
  const run = queue.then(() => increment(slop));
  queue = run.catch(() => undefined);
  return run;
}

export function onStatsChanged(listener: (stats: SlopStats) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'session' || !changes[STATS_KEY]) {
      return;
    }
    listener(toStats(changes[STATS_KEY].newValue as Partial<SlopStats> | undefined));
  });
}
