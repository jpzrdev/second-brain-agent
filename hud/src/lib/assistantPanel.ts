import { useSyncExternalStore } from 'react'

// The side chat: docked beside the screen on a wide window (the page makes room for it), a full sheet on the
// phone. On a wide window it starts open and stays as the user left it; the phone always starts with the day.
const KEY = 'gandalf-panel'
export const WIDE = '(min-width: 1024px)'

const isWide = () => typeof window !== 'undefined' && window.matchMedia?.(WIDE).matches === true

function restore(): boolean {
  try {
    return isWide() && localStorage.getItem(KEY) !== 'closed'
  } catch {
    return false
  }
}

let open = restore()
const listeners = new Set<() => void>()

function set(next: boolean) {
  open = next
  try {
    localStorage.setItem(KEY, next ? 'open' : 'closed')
  } catch {
    // no persistence
  }
  listeners.forEach((f) => f())
}

export const assistantPanel = {
  isOpen: () => open,
  isWide,
  subscribe(f: () => void) {
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  },
  open: () => set(true),
  close: () => set(false),
  toggle: () => set(!open),
}

export function useAssistantPanel(): boolean {
  return useSyncExternalStore(assistantPanel.subscribe, assistantPanel.isOpen)
}
