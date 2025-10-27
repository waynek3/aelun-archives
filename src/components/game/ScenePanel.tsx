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
  const danger = (predicate?.stateFlags as any)?.danger === true

  return (
    <Panel className="p-4" aria-live="polite" role="region">
      <h3 className="text-cyan-400 uppercase">{name}</h3>
      <p className="opacity-90 max-w-[66ch] mt-1">{desc}</p>
      <div className="mt-2 text-xs flex flex-wrap gap-1 items-center">
        {tags.map((t) => (
          <span key={t} className="tag">[{t.toUpperCase()}]</span>
        ))}
        <span className="tag">[{timescale.toUpperCase()}]</span>
        <span className={danger ? 'text-red-400 ml-2' : 'text-green-400 ml-2'}>
          {danger ? 'DANGER' : 'SAFE'}
        </span>
      </div>
    </Panel>
  )
}
