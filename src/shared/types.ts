export type Settings = {
  apiKey: string;
  enabled: boolean;
  /** Noul above this value marks the post as slop. Range 0.5–1.0, default 0.8. */
  threshold: number;
};

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  enabled: true,
  threshold: 0.8,
};

export type CheckPostRequest = {
  type: 'CHECK_POST';
  text: string;
};

export type CheckPostResponse = {
  slop: boolean;
  /** Set when the check failed. The post is then left unchanged. */
  error?: string;
};

export type ExtensionMessage = CheckPostRequest;

export type SlopStats = {
  checked: number;
  marked: number;
};
