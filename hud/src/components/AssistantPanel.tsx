import { Brain, Eye, EyeOff, MessageSquarePlus, Sparkles, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { assistantPanel, useAssistantPanel } from '../lib/assistantPanel'
import { chat, useChat } from '../lib/chatStore'
import { cn } from '../lib/cn'
import { useAgent, useConversations, useUpdateConversation } from '../lib/queries'
import { screen, useScreen } from '../lib/screenContext'
import { ChatThread } from './ChatThread'
import { Mascot } from './Mascot'
import { IconChip } from './ui'
import { focusRing, raised } from './ui/styles'

const iconBase = cn('grid size-9 shrink-0 cursor-pointer place-items-center rounded-pill active:shadow-sunken-sm disabled:cursor-default disabled:opacity-45', focusRing)
const iconButton = cn(iconBase, 'shadow-raised-sm')

/** What's on screen goes with each question; one tap leaves it out (until the next screen). */
function ScreenChip() {
  const { context, attached } = useScreen()
  if (!context) return null
  return (
    <button
      type="button"
      aria-pressed={attached}
      onClick={() => screen.setAttached(!attached)}
      title={attached ? 'The assistant sees this screen; tap to leave it out' : 'Left out; tap to show this screen to the assistant'}
      className={cn(
        'flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-pill px-3 py-1.5 text-left text-xs font-semibold transition-shadow',
        focusRing,
        attached ? 'text-primary-text shadow-sunken-sm' : 'text-ink-muted line-through shadow-raised-sm',
      )}
    >
      {attached ? <Eye className="size-3.5 shrink-0" aria-hidden /> : <EyeOff className="size-3.5 shrink-0" aria-hidden />}
      <span className="shrink-0">{attached ? 'Seeing:' : 'Not seeing:'}</span>
      <span className="truncate">{context.view}</span>
    </button>
  )
}

/** The conversation beside the screen: docked on the right on a wide window, a full sheet on the phone. */
export function AssistantPanel() {
  const open = useAssistantPanel()
  const agentName = useAgent().name
  const { conversationId, deep, turns } = useChat()
  const { data: recent = [] } = useConversations(5)
  const update = useUpdateConversation()
  const { pathname, state } = useLocation()
  const title = recent.find((c) => c.id === conversationId)?.title

  // On the phone the sheet covers the screen: a link in a reply (Terminals, a note) closes it to show the page.
  // A redirect that means to show the chat (the old /chat) keeps it.
  const keepChat = (state as { keepChat?: boolean } | null)?.keepChat === true
  const shownPath = useRef(pathname)
  useEffect(() => {
    if (pathname === shownPath.current) return // only a route change, not the first render
    shownPath.current = pathname
    if (!assistantPanel.isWide() && !keepChat) assistantPanel.close()
  }, [pathname, keepChat])

  function setDeep(on: boolean) {
    chat.setDeep(on)
    if (conversationId) update.mutate({ id: conversationId, deep: on })
  }

  if (!open) return null
  return (
    <aside
      aria-label={`Conversation with ${agentName}`}
      className={cn(
        raised,
        // z-50: on the phone the sheet goes over the bottom bar (z-40) too.
        'anim-dock fixed inset-0 z-50 flex flex-col gap-3 p-4 shadow-raised-lg lg:inset-y-3 lg:right-3 lg:left-auto lg:w-[25rem] lg:rounded-card lg:p-5',
      )}
    >
      <header className="flex items-center gap-2">
        <IconChip color="primary" size="sm">
          <Sparkles />
        </IconChip>
        <h2 className="min-w-0 flex-1 truncate font-semibold" title={title || undefined}>
          {title || `Talk to ${agentName}`}
        </h2>
        <button
          type="button"
          aria-pressed={deep}
          onClick={() => setDeep(!deep)}
          aria-label="Deep thinking"
          title={deep ? 'Deep thinking: on (a smarter model thinks each answer through, slower)' : 'Deep thinking: off'}
          className={cn(iconBase, 'transition-[box-shadow,color]', deep ? 'text-gold shadow-sunken-sm [&_svg]:drop-shadow-[0_0_6px_var(--color-gold)]' : 'text-ink-muted shadow-raised-sm')}
        >
          <Brain className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={() => chat.reset()} disabled={turns.length === 0} aria-label="New conversation" title="New conversation" className={iconButton}>
          <MessageSquarePlus className="size-4" aria-hidden />
        </button>
        <button type="button" onClick={assistantPanel.close} aria-label="Close the conversation" title="Close" className={iconButton}>
          <X className="size-4" strokeWidth={2.5} aria-hidden />
        </button>
      </header>
      <Mascot size="row" />
      <ScreenChip />
      <ChatThread className="min-h-0 flex-1" height="min-h-0 flex-1" autoFocus />
      <Link to="/conversations" className={cn('w-fit rounded-pill px-2 py-1 text-xs font-semibold text-primary-text', focusRing)}>
        past conversations
      </Link>
    </aside>
  )
}
