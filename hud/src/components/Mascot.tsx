import { useIsMutating } from '@tanstack/react-query'
import { pronoun } from '../lib/avatar'
import { cn } from '../lib/cn'
import { mascot, useMascot } from '../lib/mascot'
import { useAgent, useSessions, useToday } from '../lib/queries'
import { WizardFigure, type MascotState } from './WizardFigure'

const PHRASE: Record<MascotState, string> = {
  normal: '',
  thinking: 'consulting the scrolls…',
  talking: 'speaking…',
  happy: 'done!',
  confused: "hmm… that wasn't clear",
  petted: 'thank you, friend',
  sleeping: 'napping… tap to wake {him} up',
  tired: 'tired; chat with {him} a little',
}

function mood(doneToday: number, overdue: number): number {
  return Math.max(0, Math.min(100, 45 + doneToday * 15 - overdue * 12))
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-[0.7rem] font-semibold text-ink-muted">
      <span className="w-14">{label}</span>
      <span
        className="h-2 flex-1 overflow-hidden rounded-pill shadow-sunken-sm"
        role="meter"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className={cn('block h-full rounded-pill transition-[width] duration-700', color)} style={{ width: `${value}%` }} />
      </span>
    </div>
  )
}

/** `row`: the figure beside its phrase and meters (the side chat's narrow column). */
type Props = { size?: 'sm' | 'md' | 'row'; className?: string }

/** The assistant's tamagotchi: reacts to what happens in the chat (thinking, speaking, done, confused),
 * sleeps at night, gets tired without conversation and is in a good mood when tasks move along. */
export function Mascot({ size = 'md', className }: Props) {
  const agent = useAgent()
  const m = useMascot()
  const thinkingChat = useIsMutating({ mutationKey: ['ask'] }) > 0
  const { data: sessions } = useSessions()
  const { data: today } = useToday()
  const sessionRunning = sessions?.some((s) => s.status === 'running') ?? false
  const humor = today ? mood(today.tasks.done_today, today.tasks.overdue) : 50

  const state: MascotState =
    m.moment ?? (thinkingChat || sessionRunning ? 'thinking' : m.night ? 'sleeping' : m.energy < 25 ? 'tired' : 'normal')
  const phrase =
    PHRASE[state].replace('{him}', pronoun(agent.gender).object) ||
    (humor >= 70 ? 'in a great mood: the tasks are moving along' : humor < 35 ? 'worried about the overdue tasks' : 'serene, at your service')

  const row = size === 'row'
  return (
    <div className={cn('flex items-center', row ? 'gap-3' : 'flex-col gap-2', className)}>
      <button
        type="button"
        onClick={() => {
          mascot.feed(5)
          mascot.react('petted', 1800)
        }}
        aria-label={`Pet ${agent.name}`}
        title={`Pet ${pronoun(agent.gender).object}`}
        data-state={state}
        className={cn('mascot shrink-0 cursor-pointer rounded-card', size === 'md' ? 'size-48' : size === 'row' ? 'size-16' : 'size-20')}
      >
        <WizardFigure state={state} gender={agent.gender} avatar={agent.avatar} />
      </button>
      <div className={cn('flex flex-col gap-2', row ? 'min-w-0 flex-1' : 'w-full items-center')}>
        <p role="status" className={cn('text-xs font-semibold text-ink-muted', !row && 'text-center')}>
          {agent.name}: {phrase}
        </p>
        {size !== 'sm' && (
          <div className="flex w-full max-w-56 flex-col gap-1.5">
            <Meter label="Energy" value={m.energy} color="bg-gold" />
            <Meter label="Mood" value={humor} color="bg-primary" />
          </div>
        )}
      </div>
    </div>
  )
}
