import type { Platform } from '../../shared/types';
import { facebookAdapter } from './facebook';
import { linkedinAdapter } from './linkedin';
import { xAdapter } from './x';
import type { PlatformAdapter } from './types';

export type { ExtractedPost, PlatformAdapter } from './types';

export function detectPlatform(hostname = location.hostname): Platform | null {
  if (hostname.includes('x.com') || hostname.includes('twitter.com')) {
    return 'x';
  }
  if (hostname.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (hostname.includes('facebook.com')) {
    return 'facebook';
  }
  return null;
}

export function adapterFor(platform: Platform): PlatformAdapter {
  switch (platform) {
    case 'x':
      return xAdapter;
    case 'linkedin':
      return linkedinAdapter;
    case 'facebook':
      return facebookAdapter;
  }
}
