import { hashText } from '../shared/hash';
import type { Detector } from './types';

/** Share of posts the mock marks as slop. */
export const MOCK_SLOP_PERCENT = 30;

/** Fake network latency range, in milliseconds. */
export const MOCK_DELAY_MS = { min: 300, max: 1000 } as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Deterministic: the same text always gets the same verdict. */
export function mockVerdict(text: string): boolean {
  return parseInt(hashText(text), 16) % 100 < MOCK_SLOP_PERCENT;
}

export function createMockDetector(
  delay: (ms: number) => Promise<void> = sleep,
  random: () => number = Math.random,
): Detector {
  return async (text) => {
    const span = MOCK_DELAY_MS.max - MOCK_DELAY_MS.min;
    await delay(MOCK_DELAY_MS.min + Math.round(random() * span));
    return mockVerdict(text);
  };
}
