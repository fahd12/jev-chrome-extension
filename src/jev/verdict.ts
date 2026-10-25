import { DEFAULT_SETTINGS } from '../shared/types';

/** Fallback threshold when none is provided. */
export const SLOP_THRESHOLD = DEFAULT_SETTINGS.threshold;

export function isSlopScore(noul: number, threshold: number = SLOP_THRESHOLD): boolean {
  return noul > threshold;
}
