import { StatBar } from '@/components/ui/StatBar'

interface StatusBarProps {
  hp: { current: number; max: number }
  traitsCount: number
  turn: number
  timescale: string
}

export function StatusBar({ hp, traitsCount, turn, timescale }: StatusBarProps) {
  return (
    <footer className="panel p-3 text-xs" role="region" aria-label="Status bar">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="flex items-center gap-3">
          <div className="min-w-[160px]">
            <StatBar label="HP" value={hp.current} max={hp.max} />
          </div>
        </div>
        <div className="text-sm">Traits: {traitsCount}</div>
        <div className="text-sm text-right">Turn: {turn} ({timescale})</div>
      </div>
    </footer>
  )
}
