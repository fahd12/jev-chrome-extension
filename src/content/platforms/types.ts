import type { Platform } from '../../shared/types';

export type ExtractedPost = {
  root: HTMLElement;
  text: string;
  author?: string;
  /** Preferred insertion point (timestamp/name). Falls back to root. */
  anchor: HTMLElement;
};

export type PlatformAdapter = {
  platform: Platform;
  findPosts(root?: ParentNode): ExtractedPost[];
};
