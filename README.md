# X AI Slop Marker

Chrome Manifest V3 extension for **X** (x.com). Each post that scrolls into view is checked. Posts judged to be AI slop get a red **AI slop** banner. Good posts are left unchanged.

## Detector modes

The `DETECTOR` constant in `src/detector/mode.ts` selects the detector.

- **`'mock'`** (default) — no network calls. The result is random but fixed per post text: about 1 in 3 posts is slop, after a 300–1000 ms delay. No API key is needed.
- **`'jev'`** — calls TypeSafe **Jev** from the service worker with one draft Noul question, `isSlop`. A post is marked when `isSlop` (noul) is greater than `0.8`.

The API key is stored in `chrome.storage.local` and used only in the service worker. Content scripts never see the key.

## Rules

- Posts under 12 words are skipped and never marked.
- Timeline, profile, and search pages are checked.
- Thread detail pages (`/user/status/id`) are skipped.
- A quoted post is checked separately from the outer post. Each gets its own banner.
- No banner shows while a check is loading.

## Requirements

- Node.js 20+
- For Jev mode: a TypeSafe API key from [console.typesafe.ai](https://console.typesafe.ai)

## Build

```bash
npm install
npm test
npm run build
```

`npm run build` writes an unpacked extension to `dist/`.

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist/` folder
4. Open the popup. Make sure **Enabled on x.com** is on. For Jev mode, paste your API key and save.
5. Open [x.com](https://x.com) and scroll the timeline.

## Manual verification checklist

- [ ] About 1 in 3 long posts gets an **AI slop** banner
- [ ] The same posts stay marked after you scroll away and back
- [ ] Short posts (under 12 words) are never marked
- [ ] Quoted posts get their own banner
- [ ] A banner does not move or resize the post or its quoted post
- [ ] Turning **Enabled on x.com** off removes the banners
- [ ] Popup **Checked** and **Marked as AI slop** counts rise as you scroll
- [ ] No banner shows while a post is loading

## Privacy

The extension only reads public post text already on the page. In mock mode nothing leaves the browser. In Jev mode only the post text is sent to TypeSafe.
