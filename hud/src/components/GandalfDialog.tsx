import { useIsMutating, useQuery } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { useRef, type MouseEvent, type PointerEvent } from 'react'
import { api, type VoiceStatus } from '../lib/api'
import { assistantPanel, useAssistantPanel } from '../lib/assistantPanel'
import { cn } from '../lib/cn'
import { useVoice } from '../lib/useVoice'
import { AssistantPanel } from './AssistantPanel'
import { Pomodoro } from './Pomodoro'
import { Orb, useToast } from './ui'
import { focusRing } from './ui/styles'
import { useAgent } from '../lib/queries'

const HINT = {
  idle: 'Hold to talk',
  listening: 'Listening… release to send (Esc cancels)',
  thinking: 'Thinking…',
  speaking: 'Speaking… (click or Esc to stop)',
}

// A press shorter than this is a "click": it toggles recording (handy on the keyboard and on the phone).
const CLICK_MS = 300

/** The fixed side stack (on every screen): pomodoro, the side chat's button (on the phone it's on the bottom bar)
 * and the Orb (hold to talk). */
export function GandalfDialog() {
  const agentName = useAgent().name
  const open = useAssistantPanel()
  const toast = useToast()
  const { data: voiceStatus } = useQuery({ queryKey: ['voice'], queryFn: () => api<VoiceStatus>('/voice/status'), staleTime: 60_000 })
  const voiceReady = Boolean(voiceStatus?.stt)
  const typing = useIsMutating({ mutationKey: ['ask'] }) > 0
  const { state, start, finish } = useVoice({
    onReply: () => assistantPanel.open(),
    onError: (m) => toast('error', m),
  })
  const pressedAt = useRef(0)
  const clickMode = useRef(false)

  function onPress(e: PointerEvent) {
    if (!voiceReady) return
    try {
      // Keeps receiving the "release" even if the finger/mouse leaves the button.
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // some browsers refuse the capture; releasing over the button still works
    }
    pressedAt.current = performance.now()
    if (state === 'listening' && clickMode.current) return // the release will finish it
    clickMode.current = false
    void start()
  }

  function onRelease() {
    if (!voiceReady || state === 'speaking') return
    const duration = performance.now() - pressedAt.current
    if (state === 'listening' && clickMode.current) {
      clickMode.current = false
      return finish()
    }
    // A quick tap: keeps recording until the next click.
    if (duration < CLICK_MS) {
      clickMode.current = true
      return
    }
    finish()
  }

  function onKeyboardClick(e: MouseEvent) {
    // detail === 0: it came from the keyboard (Enter/Space). Toggles recording.
    if (e.detail !== 0) return
    if (!voiceReady) return assistantPanel.open()
    if (state === 'listening') return finish()
    void start()
  }

  const orbState = state === 'idle' && typing ? 'thinking' : state

  return (
    <>
      {/* With the side chat open, the stack moves to the left of it. */}
      <div className={cn('fixed right-5 bottom-28 z-30 flex flex-col items-center gap-3 lg:bottom-8', open ? 'lg:right-[27.5rem]' : 'lg:right-8')}>
        <Pomodoro />
        <button
          type="button"
          aria-label={`Conversation with ${agentName}`}
          aria-pressed={open}
          onClick={assistantPanel.toggle}
          className={cn(
            'hidden size-11 cursor-pointer place-items-center rounded-pill bg-surface hover:text-ink active:shadow-sunken-sm',
            open ? 'text-primary-text shadow-sunken-sm' : 'text-ink-muted shadow-raised-sm',
            focusRing,
            'lg:grid',
          )}
        >
          <MessageCircle className="size-5" aria-hidden />
        </button>
        <div className="relative">
          {state !== 'idle' && (
            <p
              role="status"
              className="absolute right-full bottom-3 mr-3 w-max max-w-56 rounded-control bg-surface px-3 py-2 text-xs font-semibold shadow-raised"
            >
              {HINT[state]}
            </p>
          )}
          <Orb
            mode={voiceReady ? 'voice' : 'chat'}
            state={orbState}
            title={voiceReady ? HINT.idle : 'Voice unavailable: models not downloaded'}
            onPointerDown={onPress}
            onPointerUp={onRelease}
            onPointerCancel={onRelease}
            onClick={(e) => {
              if (!voiceReady && e.detail !== 0) return assistantPanel.open()
              onKeyboardClick(e)
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="touch-none select-none"
          />
        </div>
      </div>
      <AssistantPanel />
    </>
  )
}
