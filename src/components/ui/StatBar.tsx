interface StatBarProps {
  label?: string
  value: number
  max: number
}

export function StatBar({ label = 'HP', value, max }: StatBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)))
  const color = pct > 75 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-400' : pct > 25 ? 'bg-orange-500' : 'bg-red-500'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1 opacity-90">
        <span>{label}:</span>
        <span>
          [{value}/{max}]
        </span>
      </div>
      <div className="w-full h-3 bg-gray-600">
        <div className={`h-3 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
