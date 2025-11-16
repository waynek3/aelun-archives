import { memo } from 'react'
import { StatBar } from '@/components/ui/StatBar'

interface StatusBarProps {
  hp: { current: number; max: number }
  traitsCount: number
  turn: number
  timescale: string
  affinities?: Array<{ label: string; score: number }>
  showAffinityLabel?: boolean
}

export const StatusBar = memo(function StatusBar({ hp, traitsCount, turn, timescale, affinities, showAffinityLabel = true }: StatusBarProps) {
  const affinityText = showAffinityLabel
    ? (affinities && affinities.length > 0
        ? affinities
            .map(({ label, score }) => `${label} ${score > 0 ? '+' : ''}${score}`)
            .join(', ')
        : 'Hidden')
    : 'Hidden';

  return (
    <footer className="panel p-3 text-xs" role="region" aria-label="Status bar">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        <div>
          <StatBar label="HP" value={hp.current} max={hp.max} />
        </div>
        <div className="text-sm">
          <div>Traits: {traitsCount}</div>
          <div className="mt-1">Turn: {turn} ({timescale})</div>
        </div>
        <div className="text-sm md:text-right">
          <div>Affinities: {affinityText}</div>
        </div>
      </div>
    </footer>
  )
})
