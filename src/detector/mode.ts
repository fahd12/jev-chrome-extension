import type { Settings } from '../shared/types';

export type DetectorMode = 'mock' | 'jev';

/** Jev if the user saved an API key, mock otherwise. No compile-time constant needed. */
export function resolveMode(settings: Settings): DetectorMode {
  return settings.apiKey.trim() ? 'jev' : 'mock';
}
