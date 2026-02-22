import { useGameStore } from '@/stores/gameStore'
import type { TicketType } from '@/lib/scratchLogic'

interface TicketCardProps {
  type: TicketType
  name: string
  description: string[]
  topPrize: string
  canAfford: boolean
  onBuy: () => void
}

function TicketCard({ type, name, description, topPrize, canAfford, onBuy }: TicketCardProps) {
  const borderColor = type === 1 ? 'border-cyan-400' : type === 5 ? 'border-green-500' : 'border-yellow-400'
  const textColor = type === 1 ? 'text-cyan-400' : type === 5 ? 'text-green-500' : 'text-yellow-400'

  return (
    <div className={`panel border-2 p-4 ${borderColor}`} style={{ borderStyle: type === 10 ? 'double' : 'solid' }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className={`font-bold text-lg ${textColor}`}>${type}</span>
          <span className="text-gray-300 ml-2 uppercase tracking-widest text-sm">{name}</span>
        </div>
        <span className={`text-xs ${textColor} uppercase`}>TOP: {topPrize}</span>
      </div>

      <div className="mb-3 space-y-0.5">
        {description.map((line, i) => (
          <div key={i} className="text-gray-400 text-sm">{line}</div>
        ))}
      </div>

      <button
        className={`btn w-full px-4 py-2 text-sm font-bold uppercase tracking-wider ${
          canAfford ? 'btn-primary' : 'opacity-40 cursor-not-allowed border-gray-600 text-gray-600 border-2'
        }`}
        onClick={onBuy}
        disabled={!canAfford}
      >
        {canAfford ? `[ BUY — $${type}.00 ]` : `[ NEED $${type}.00 ]`}
      </button>
    </div>
  )
}

export default function StoreScreen() {
  const money = useGameStore(s => s.money)
  const buyTicket = useGameStore(s => s.buyTicket)
  const goToEndOfDay = useGameStore(s => s.goToEndOfDay)

  const tickets: { type: TicketType; name: string; description: string[]; topPrize: string }[] = [
    {
      type: 1,
      name: 'Lucky Trio',
      description: [
        'Scratch 3 symbols.',
        'Match 2 → win $2',
        'Match 3 → win $5',
      ],
      topPrize: '$5',
    },
    {
      type: 5,
      name: 'Double Down',
      description: [
        'Scratch 2 rows of 3.',
        'Row 1 match → win $10',
        'Row 2 match → win $25',
      ],
      topPrize: '$35',
    },
    {
      type: 10,
      name: 'Big Score',
      description: [
        'Scratch 3 rows of 3.',
        'Row 1 → $20  Row 2 → $50',
        'Row 3 → $100',
      ],
      topPrize: '$170',
    },
  ]

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="panel-double border-2 p-4 mb-4 text-center" style={{ borderStyle: 'double' }}>
          <div className="text-green-500 font-bold text-xl uppercase tracking-widest">
            ╔══ LUCKY LOTTO ══╗
          </div>
          <div className="text-gray-400 text-sm mt-1 uppercase tracking-wider">
            Scratch-Off Emporium
          </div>
        </div>

        {/* Wallet */}
        <div className="panel border p-3 mb-4 flex justify-between items-center">
          <span className="text-gray-400 uppercase text-sm tracking-wider">WALLET</span>
          <span className="text-green-500 font-bold text-lg">${money.toFixed(2)}</span>
        </div>

        {/* Ticket menu */}
        <div className="space-y-3 mb-4">
          {tickets.map(t => (
            <TicketCard
              key={t.type}
              {...t}
              canAfford={money >= t.type}
              onBuy={() => buyTicket(t.type)}
            />
          ))}
        </div>

        {/* End day button */}
        <button
          className="btn btn-warning w-full py-3 uppercase tracking-wider font-bold"
          onClick={goToEndOfDay}
        >
          [ END THE DAY ]
        </button>
      </div>
    </div>
  )
}
