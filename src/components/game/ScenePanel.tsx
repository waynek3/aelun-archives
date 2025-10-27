import type { PredicateCard } from '@/types/cards'
import { Panel } from '@/components/ui/Panel'

interface ScenePanelProps {
  predicate: PredicateCard | null
}

export function ScenePanel({ predicate }: ScenePanelProps) {
  const name = predicate?.name ?? 'Unknown'
  const desc = predicate?.description ?? '...'
  const tags = predicate?.sceneTags ?? []
  const timescale = predicate?.timescale ?? 'Day'
  const stateFlags = predicate?.stateFlags ?? {}

  // Get state flag information
  const getStateFlagInfo = (flag: string, _value: any) => {
    const flagMap: Record<string, { color: string; text: string; icon: string }> = {
      danger: { color: 'text-red-400', text: 'DANGER', icon: '⚠' },
      dangerous: { color: 'text-red-400', text: 'DANGEROUS', icon: '⚡' },
      mysterious: { color: 'text-purple-400', text: 'MYSTERIOUS', icon: '?' },
      sacred: { color: 'text-yellow-400', text: 'SACRED', icon: '⛪' },
      criminal: { color: 'text-orange-400', text: 'CRIMINAL', icon: '⚔' },
      healing: { color: 'text-green-400', text: 'HEALING', icon: '❤' },
      trade: { color: 'text-cyan-400', text: 'TRADE', icon: '💰' },
      cursed: { color: 'text-red-600', text: 'CURSED', icon: '💀' }
    }
    return flagMap[flag] || { color: 'text-gray-400', text: flag.toUpperCase(), icon: '•' }
  }

  // Determine overall safety level
  const hasDanger = stateFlags.danger === true || stateFlags.dangerous === true || stateFlags.cursed === true
  const hasCriminal = stateFlags.criminal === true

  return (
    <Panel className="p-4" aria-live="polite" role="region">
      <h3 className="text-cyan-400 uppercase">{name}</h3>
      <p className="opacity-90 max-w-[66ch] mt-1">{desc}</p>
      
      {/* Scene Tags */}
      <div className="mt-2 text-xs flex flex-wrap gap-1 items-center">
        {tags.map((t) => (
          <span key={t} className="tag">[{t.toUpperCase()}]</span>
        ))}
        <span className="tag">[{timescale.toUpperCase()}]</span>
      </div>

      {/* State Flags */}
      {Object.keys(stateFlags).length > 0 && (
        <div className="mt-2 text-xs flex flex-wrap gap-1 items-center">
          {Object.entries(stateFlags).map(([flag, value]) => {
            if (value === true) {
              const info = getStateFlagInfo(flag, value)
              return (
                <span key={flag} className={`${info.color} font-bold`}>
                  {info.icon} {info.text}
                </span>
              )
            }
            return null
          })}
        </div>
      )}

      {/* Overall Safety Status */}
      <div className="mt-2 text-xs">
        <span className={hasDanger ? 'text-red-400 font-bold' : hasCriminal ? 'text-orange-400 font-bold' : 'text-green-400 font-bold'}>
          {hasDanger ? '⚠ UNSAFE' : hasCriminal ? '⚔ RISKY' : '✓ SAFE'}
        </span>
      </div>
    </Panel>
  )
}
