export type Platform = 'x' | 'facebook' | 'linkedin';

export type Settings = {
  apiKey: string;
  enabled: boolean;
  checkAi: boolean;
  checkMisinfo: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  enabled: true,
  checkAi: true,
  checkMisinfo: true,
};

export type AnalyzePostRequest = {
  type: 'ANALYZE_POST';
  postId: string;
  platform: Platform;
  text: string;
  author?: string;
};

export type GetSettingsRequest = {
  type: 'GET_SETTINGS';
};

export type ExtensionMessage = AnalyzePostRequest | GetSettingsRequest;

export type VerdictKind =
  | 'loading'
  | 'no_key'
  | 'error'
  | 'uncertain'
  | 'likely_ai'
  | 'misinfo'
  | 'likely_ai_misinfo'
  | 'authentic';

export type VerdictTone = 'neutral' | 'muted' | 'amber' | 'red' | 'green';

export type Verdict = {
  kind: VerdictKind;
  label: string;
  tone: VerdictTone;
  isAi?: number;
  isFake?: number;
  postType?: string;
  postTypeConfidence?: number;
  model?: string;
  error?: string;
};

export type AnalyzePostResponse = {
  type: 'ANALYZE_RESULT';
  postId: string;
  verdict: Verdict;
};

export type GetSettingsResponse = {
  settings: Settings;
};
