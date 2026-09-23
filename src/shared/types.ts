export type Settings = {
  apiKey: string;
  enabled: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  enabled: true,
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
