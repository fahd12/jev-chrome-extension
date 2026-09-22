import type { Settings, Verdict } from '../shared/types';

/** Mid-band for AI Noul: near 0.5 is Jev saying it has little signal. */
export const AI_UNCERTAIN = { low: 0.35, high: 0.8 } as const;
/** Mid-band for misinfo Noul. */
export const FAKE_UNCERTAIN = { low: 0.3, high: 0.7 } as const;

export const AI_FLAG_THRESHOLD = 0.8;
export const FAKE_FLAG_THRESHOLD = 0.7;

export type JevScores = {
  isAi: number;
  isFake: number;
  postType?: string;
  postTypeConfidence?: number;
  model?: string;
};

function inBand(value: number, low: number, high: number): boolean {
  return value >= low && value <= high;
}

export function loadingVerdict(): Verdict {
  return { kind: 'loading', label: 'Checking…', tone: 'muted' };
}

export function noKeyVerdict(): Verdict {
  return {
    kind: 'no_key',
    label: 'Set API key',
    tone: 'neutral',
    error: 'Add a TypeSafe API key in the extension popup.',
  };
}

export function errorVerdict(message: string): Verdict {
  return {
    kind: 'error',
    label: 'Unavailable',
    tone: 'neutral',
    error: message,
  };
}

/**
 * Map Jev Noul probabilities to a badge.
 *
 * Noul answers have no `confidence` field — the probability is the belief.
 * Hard flags win over mid-band uncertainty so a 0.95 AI score is not
 * hidden just because the misinfo Noul landed near 0.5.
 */
export function mapVerdict(scores: JevScores, settings: Settings): Verdict {
  const checkAi = settings.checkAi;
  const checkMisinfo = settings.checkMisinfo;

  const aiFlag = checkAi && scores.isAi > AI_FLAG_THRESHOLD;
  const fakeFlag = checkMisinfo && scores.isFake > FAKE_FLAG_THRESHOLD;
  const aiUncertain =
    checkAi && inBand(scores.isAi, AI_UNCERTAIN.low, AI_UNCERTAIN.high);
  const fakeUncertain =
    checkMisinfo &&
    inBand(scores.isFake, FAKE_UNCERTAIN.low, FAKE_UNCERTAIN.high);

  const base = {
    isAi: scores.isAi,
    isFake: scores.isFake,
    postType: scores.postType,
    postTypeConfidence: scores.postTypeConfidence,
    model: scores.model,
  };

  if (aiFlag && fakeFlag) {
    return {
      ...base,
      kind: 'likely_ai_misinfo',
      label: 'Likely AI · Misinfo',
      tone: 'red',
    };
  }

  if (aiFlag) {
    return {
      ...base,
      kind: 'likely_ai',
      label: 'Likely AI',
      tone: 'red',
    };
  }

  if (fakeFlag) {
    return {
      ...base,
      kind: 'misinfo',
      label: 'Potential misinfo',
      tone: 'red',
    };
  }

  if (aiUncertain || fakeUncertain) {
    return {
      ...base,
      kind: 'uncertain',
      label: 'Uncertain',
      tone: 'amber',
    };
  }

  return {
    ...base,
    kind: 'authentic',
    label: checkAi && !checkMisinfo ? 'Likely human' : 'Likely authentic',
    tone: 'green',
  };
}
