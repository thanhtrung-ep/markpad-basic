import { defineManifest } from "@crxjs/vite-plugin"
import pkg from "./package.json" with { type: "json" }

export default defineManifest({
  manifest_version: 3,
  name: pkg.displayName,
  description: pkg.description,
  version: pkg.version,
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
  action: {
    default_title: "Markpad Basic",
    default_popup: "src/popup/index.html",
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  // storage: all data stays in chrome.storage.local
  // contextMenus: right-click "Save to Markpad"
  // tabs: read the active tab's URL for page notes + the badge count
  permissions: ["storage", "unlimitedStorage", "contextMenus", "tabs"],
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content.ts"],
      run_at: "document_idle",
      all_frames: true,
    },
  ],
})
