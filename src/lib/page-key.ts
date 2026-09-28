/**
 * The key a page note is anchored to: origin + path, without query string or
 * hash, so `?utm=…` and `#section` variants of one article share its notes.
 * Returns null for pages notes cannot belong to (chrome://, about:blank, …).
 */
export function pageKey(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null
  let u: URL
  try {
    u = new URL(rawUrl)
  } catch {
    return null
  }
  if (u.protocol !== "http:" && u.protocol !== "https:" && u.protocol !== "file:") return null
  const path = u.pathname.length > 1 ? u.pathname.replace(/\/+$/, "") : u.pathname
  return `${u.origin}${path}`
}
