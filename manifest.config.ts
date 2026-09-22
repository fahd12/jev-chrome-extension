import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

const socialMatches = [
  '*://twitter.com/*',
  '*://*.twitter.com/*',
  '*://x.com/*',
  '*://*.x.com/*',
  '*://facebook.com/*',
  '*://*.facebook.com/*',
  '*://linkedin.com/*',
  '*://*.linkedin.com/*',
];

export default defineManifest({
  manifest_version: 3,
  name: 'Social Media Authenticity Validator',
  short_name: 'Jev Auth',
  description: pkg.description,
  version: pkg.version,
  icons: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
  },
  action: {
    default_title: 'Jev Authenticity Validator',
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
  permissions: ['storage', 'activeTab', 'scripting'],
  host_permissions: [...socialMatches, 'https://api.typesafe.ai/*'],
  content_scripts: [
    {
      matches: socialMatches,
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
});
