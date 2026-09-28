import { chromium, test as base, type BrowserContext } from "@playwright/test"
import path from "node:path"

const dist = path.resolve(import.meta.dirname, "../../dist")

/** Loads the built extension from dist/ — run `npm run build` first. */
export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    })
    await use(context)
    await context.close()
  },
  extensionId: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"))
    await use(new URL(worker.url()).host)
  },
})

export { expect } from "@playwright/test"
