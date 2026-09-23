import { evaluateSlop } from '../jev/client';
import { isSlopScore } from '../jev/verdict';
import type { Settings } from '../shared/types';
import { createMockDetector } from './mock';
import { DETECTOR } from './mode';
import type { Detector } from './types';

export { DETECTOR };

export function getDetector(settings: Settings): Detector {
  if (DETECTOR === 'mock') {
    return createMockDetector();
  }

  const apiKey = settings.apiKey.trim();
  if (!apiKey) {
    return async () => {
      throw new Error('No TypeSafe API key. Add it in the popup.');
    };
  }

  return (text) => evaluateSlop(apiKey, text).then(isSlopScore);
}
