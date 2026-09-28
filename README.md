# Markpad Basic

A small Chrome extension that keeps three things one click away while you browse:

- **Snippets**: save text you type often. Click a snippet to copy it, or give it an alias and type `#alias` then press **Ctrl+Shift+K** in any text field to expand it in place.
- **Vocabulary**: collect words and their meanings, then review them with spaced repetition (SM-2: Again / Hard / Good / Easy).
- **Notes**: write notes attached to the page you are on. The toolbar badge shows how many notes the current page has; *All pages* lists every note with a link back.

Select text on any page and right-click to save it as a snippet, a vocabulary word or a page note.
Everything is stored locally in `chrome.storage.local`, with nothing sent anywhere. **Export / Import** in the popup footer saves a JSON backup.

## Develop

```bash
npm install
npm run build        # typecheck + build into dist/
npm test             # unit tests (Vitest)
npm run test:e2e     # loads dist/ into Chromium and drives the popup (Playwright)
```

Load it in Chrome: `chrome://extensions` → enable *Developer mode* → *Load unpacked* → select `dist/`.
Pages that were already open need a reload before alias expansion works there.

## Stack

Vue 3 · TypeScript · Vite · Tailwind CSS v4 · [CRXJS](https://crxjs.dev/)

```
src/
  background.ts      context menus + page-note badge
  content.ts         #alias expansion in text fields and contenteditable
  lib/               pure logic (SM-2, alias matching, page keys, backup) + tests
  popup/             the popup UI (one component per tab)
tests/e2e/           Playwright smoke tests against the built extension
```
