import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

const xMatches = [
  '*://x.com/*',
  '*://*.x.com/*',
  '*://twitter.com/*',
  '*://*.twitter.com/*',
];

export default defineManifest({
  manifest_version: 3,
  name: 'X AI Slop Marker',
  short_name: 'AI Slop',
  description: pkg.description,
  version: pkg.version,
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_title: 'X AI Slop Marker',
    default_popup: 'src/popup/index.html',
    default_icon: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  permissions: ['storage'],
  host_permissions: [...xMatches, 'https://api.typesafe.ai/*'],
  content_scripts: [
    {
      matches: xMatches,
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
});
