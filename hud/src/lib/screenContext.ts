import { useEffect, useSyncExternalStore } from 'react'

// What the screen shows, for the side chat: the assistant sees what the user sees. A screen says it with
// useScreenContext; the chat sends it with each question, and the user can leave it out with one tap.
export type ScreenContext = {
  /** The screen's name, e.g. "Studies › Calculus › Limits". */
  view: string
  /** The memory note on screen (a study topic, a research part, a note in Memory): its text goes along. */
  note?: string
}

type State = { context: ScreenContext | null; attached: boolean }

let state: State = { context: null, attached: true }
const listeners = new Set<() => void>()

function set(next: State) {
  state = next
  listeners.forEach((f) => f())
}

export const screen = {
  get: () => state,
  subscribe(f: () => void) {
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  },
  /** What goes with a question: nothing when no screen said anything or the user left it out. */
  current: (): ScreenContext | null => (state.attached ? state.context : null),
  setAttached(attached: boolean) {
    set({ ...state, attached })
  },
}

/** A screen tells the chat what it shows (while it's mounted). `view` empty: still loading, nothing yet. */
export function useScreenContext(view: string | null | undefined, note?: string | null) {
  useEffect(() => {
    if (!view) return
    const context: ScreenContext = { view, note: note || undefined }
    // A new screen goes along again: leaving it out was about the previous one.
    set({ context, attached: true })
    return () => {
      if (state.context === context) set({ ...state, context: null })
    }
  }, [view, note])
}

export function useScreen(): State {
  return useSyncExternalStore(screen.subscribe, screen.get)
}
