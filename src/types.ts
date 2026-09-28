import type { ReviewState } from "./lib/sm2"

export interface Snippet {
  id: string
  title: string
  content: string
  /** Typed as `#alias` + Ctrl+Shift+K in any text field to expand. */
  alias?: string
  createdAt: number
  updatedAt: number
}

export interface Term {
  id: string
  term: string
  definition: string
  example?: string
  createdAt: number
  updatedAt: number
  _review?: ReviewState
}

export interface Note {
  id: string
  /** Normalized page key — see `pageKey()`. */
  url: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

export interface Collections {
  snippets: Snippet[]
  terms: Term[]
  notes: Note[]
}

export type CollectionKey = keyof Collections
