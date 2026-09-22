# Social Media Authenticity Validator

Chrome Manifest V3 extension that reads public post text on **X**, **Facebook**, and **LinkedIn**, then asks TypeSafe **Jev** two yes/no (Noul) questions:

1. Is this text likely written by an LLM?
2. Does it show misinformation cues (sensationalism, weak source cues, emotional manipulation)?

Jev is not a generative model. It returns calibrated probabilities only. The extension never asks it to summarize or rewrite a post.

## How Jev is used

The background service worker builds a small `state` object (`platform`, `postText`, optional `author`) and calls `client.systemOne()` with:

- `isAi` — Noul
- `isFake` — Noul
- `postType` — Choice (`news | opinion | personal | promotional | other`)

Noul answers have **no `confidence` field**. Values near `0.5` mean the model is unsure. The badge is **Uncertain** when a Noul lands in a mid band, **Likely AI** when `isAi > 0.8`, and **Potential misinfo** when `isFake > 0.7`.

The API key is stored in `chrome.storage.local` and used only in the service worker (`dangerouslyAllowBrowser: true` is required because a service worker is still a browser context). Content scripts never see the key.

## Requirements

- Node.js 20+
- A TypeSafe API key from [console.typesafe.ai](https://console.typesafe.ai)

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
4. Pin the extension, open the popup, paste your TypeSafe API key, and save
5. Open a public feed on [x.com](https://x.com), [linkedin.com](https://www.linkedin.com/feed/), or [facebook.com](https://www.facebook.com)
6. Scroll until a post of 12+ words is in view — a compact badge appears next to the timestamp or name

If no key is saved, badges show **Set API key** and no TypeSafe call is made.

## Verification checklist

- [ ] Popup saves the API key and remembers toggles after the popup is closed
- [ ] With no key, badges say **Set API key**
- [ ] Visible posts show **Checking…** then a green / amber / red label
- [ ] Hover or click the badge to see exact Noul probabilities and the model id
- [ ] Turning the extension off in the popup removes badges
- [ ] Infinite scroll continues to badge new posts without flooding the API (viewport + cache + 2 concurrent calls)

The Cursor browser cannot load an unpacked extension, so live feed checks have to be done in Chrome.

## Project layout

```
src/background.ts          Service worker: queue, cache, TypeSafe calls
src/jev/questions.ts       Jev state + Noul/Choice definitions
src/jev/verdict.ts         Probability → badge mapping
src/jev/client.ts          TypeSafeClient + fetch fallback
src/content/main.ts        Observers and messaging
src/content/platforms/     Resilient DOM extractors
src/content/badge.ts       Injected badge + tooltip
src/popup/                 API key and feature toggles
```

## Privacy

The extension only reads **public post text** already on the page. It does not log in, scrape private messages, or send anything except the post text (and optional author name) to TypeSafe.
