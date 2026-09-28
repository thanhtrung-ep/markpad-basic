import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures"

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  return errors
}

test("snippets: add with alias, alias must be unique, expand #alias + Ctrl+Shift+K on a page", async ({
  context,
  extensionId,
}) => {
  const popup = await context.newPage()
  const errors = watchErrors(popup)
  await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`)

  await popup.getByRole("button", { name: "New snippet" }).click()
  await popup.getByLabel("Title").fill("Signature")
  await popup.getByLabel("Snippet text").fill("Best regards,\nTrung")
  await popup.getByLabel("Alias").fill("sig")
  await popup.getByRole("button", { name: "Save" }).click()
  await expect(popup.getByTestId("snippet-row")).toContainText("#sig")

  // A second snippet cannot take the same alias.
  await popup.getByRole("button", { name: "New snippet" }).click()
  await popup.getByLabel("Snippet text").fill("x")
  await popup.getByLabel("Alias").fill("sig")
  await expect(popup.getByText("#sig is already used.")).toBeVisible()
  await popup.getByRole("button", { name: "Cancel" }).click()

  await context.route("https://markpad.test/**", (r) =>
    r.fulfill({ contentType: "text/html", body: "<textarea id=t></textarea><div id=e contenteditable></div>" }),
  )
  const site = await context.newPage()
  await site.goto("https://markpad.test/form")
  await site.locator("#t").click()
  await site.keyboard.type("Thanks! #sig")
  // The content script loads asynchronously; retry the chord until it lands.
  await expect(async () => {
    await site.keyboard.press("Control+Shift+KeyK")
    await expect(site.locator("#t")).toHaveValue("Thanks! Best regards,\nTrung", { timeout: 500 })
  }).toPass({ timeout: 5_000 })

  await site.locator("#e").click()
  await site.keyboard.type("Hi #sig")
  await site.keyboard.press("Control+Shift+KeyK")
  await expect(site.locator("#e")).toHaveText(/^Hi Best regards,\s*Trung$/)

  expect(errors).toEqual([])
})

test("vocabulary: add a word, review it with SM-2, due count drops", async ({ context, extensionId }) => {
  const popup = await context.newPage()
  const errors = watchErrors(popup)
  await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
  await popup.getByRole("tab", { name: "Vocabulary" }).click()

  await popup.getByRole("button", { name: "New word" }).click()
  await popup.getByLabel("Term").fill("serendipity")
  await popup.getByLabel("Meaning").fill("a happy accident")
  await popup.getByRole("button", { name: "Save" }).click()
  await expect(popup.getByTestId("term-row")).toContainText("serendipity")

  await popup.getByRole("button", { name: "Review (1)" }).click()
  await expect(popup.getByTestId("review-term")).toHaveText("serendipity")
  await popup.getByRole("button", { name: "Show answer" }).click()
  await expect(popup.getByText("a happy accident")).toBeVisible()
  await popup.getByRole("button", { name: "Good" }).click()
  await expect(popup.getByText("All done for now")).toBeVisible()
  await popup.getByRole("button", { name: "Back to list" }).click()
  await expect(popup.getByRole("button", { name: "Review (0)" })).toBeDisabled()

  const repetition = await popup.evaluate(async () => {
    const { terms } = await chrome.storage.local.get("terms")
    return (terms as { _review: { repetition: number } }[])[0]._review.repetition
  })
  expect(repetition).toBe(1)
  expect(errors).toEqual([])
})

test("notes: page notes show on 'All pages', edit by double-click keeps the caret at the end", async ({
  context,
  extensionId,
}) => {
  const popup = await context.newPage()
  const errors = watchErrors(popup)
  await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
  await popup.evaluate(() =>
    chrome.storage.local.set({
      notes: [{ id: "n1", url: "https://example.com/a", title: "Example", content: "Check pricing", createdAt: 1, updatedAt: 1 }],
    }),
  )
  await popup.getByRole("tab", { name: "Notes" }).click()
  // The popup page itself is the active tab here, so "This page" has nothing to attach to.
  await expect(popup.getByText("Notes can't be attached to this page.")).toBeVisible()

  await popup.getByRole("button", { name: "All pages" }).click()
  const row = popup.getByTestId("note-row")
  await expect(row).toContainText("Check pricing")
  await row.dblclick()
  const note = popup.getByLabel("Note")
  await expect(note).toBeFocused()
  await popup.keyboard.type(" page")
  await popup.getByRole("button", { name: "Save" }).click()
  await expect(row).toContainText("Check pricing page")
  expect(errors).toEqual([])
})

test("backup: export then import restores deleted items", async ({ context, extensionId }) => {
  const popup = await context.newPage()
  const errors = watchErrors(popup)
  await popup.goto(`chrome-extension://${extensionId}/src/popup/index.html`)
  await popup.evaluate(() =>
    chrome.storage.local.set({
      snippets: [{ id: "s1", title: "Hello", content: "Hello there", createdAt: 1, updatedAt: 1 }],
    }),
  )
  await expect(popup.getByTestId("snippet-row")).toHaveCount(1)

  const download = popup.waitForEvent("download")
  await popup.getByRole("button", { name: "Export" }).click()
  const file = await (await download).path()

  await popup.getByTestId("snippet-row").hover()
  await popup.getByRole("button", { name: "Delete" }).click()
  await expect(popup.getByTestId("snippet-row")).toHaveCount(0)

  await popup.locator("input[type=file]").setInputFiles(file)
  await expect(popup.getByRole("status")).toHaveText("Imported 1 item.")
  await expect(popup.getByTestId("snippet-row")).toContainText("Hello there")
  expect(errors).toEqual([])
})
