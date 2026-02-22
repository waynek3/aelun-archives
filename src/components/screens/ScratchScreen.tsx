import { useGameStore } from '@/stores/gameStore'
import { getRowResults, isFullyScratched } from '@/lib/scratchLogic'

// A single scratchable cell
function ScratchCell({
  symbol,
  revealed,
  onClick,
}: {
  symbol: string
  revealed: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`
        relative border-2 font-mono font-bold text-xl
        transition-all duration-150 select-none
        flex items-center justify-center
        ${revealed
          ? 'border-green-500 text-green-500 bg-transparent cursor-default'
          : 'border-gray-600 text-gray-600 bg-slate-900 hover:border-yellow-400 hover:text-yellow-400 cursor-pointer'
        }
      `}
      style={{ width: '3.5rem', height: '3.5rem' }}
      onClick={revealed ? undefined : onClick}
      disabled={revealed}
      aria-label={revealed ? `Symbol: ${symbol}` : 'Scratch this cell'}
    >
      {revealed ? symbol : '░░'}
    </button>
  )
}

// Row of cells with win indicator
function TicketRow({
  cells,
  rowPrize,
  allScratched,
  win,
  onScratch,
}: {
  cells: { symbol: string; revealed: boolean }[]
  rowPrize?: number
  allScratched: boolean
  win: boolean
  onScratch: (col: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {cells.map((cell, ci) => (
          <ScratchCell
            key={ci}
            symbol={cell.symbol}
            revealed={cell.revealed}
            onClick={() => onScratch(ci)}
          />
        ))}
      </div>

      {rowPrize !== undefined && (
        <div
          className={`text-sm font-mono font-bold ml-2 transition-colors duration-300 ${
            allScratched
              ? win
                ? 'text-green-500 flash-success'
                : 'text-gray-600'
              : 'text-gray-500'
          }`}
        >
          {allScratched && win ? `★ $${rowPrize}` : `$${rowPrize}`}
        </div>
      )}
    </div>
  )
}

export default function ScratchScreen() {
  const ticket = useGameStore(s => s.activeTicket)
  const scratchCell = useGameStore(s => s.scratchCell)
  const scratchAll = useGameStore(s => s.scratchAll)
  const goToStore = useGameStore(s => s.goToStore)
  const goToEndOfDay = useGameStore(s => s.goToEndOfDay)
  const money = useGameStore(s => s.money)

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="text-gray-500">No ticket loaded.</div>
      </div>
    )
  }

  const fullyScratched = isFullyScratched(ticket)
  const rowResults = getRowResults(ticket)

  // For $1 ticket there's no per-row prize display — just use full ticket result
  const isDollarTicket = ticket.type === 1
  const rowPrizes = ticket.type === 1 ? [undefined] : ticket.type === 5 ? [10, 25] : [20, 50, 100]

  const headerColor = ticket.type === 1 ? 'text-cyan-400' : ticket.type === 5 ? 'text-green-500' : 'text-yellow-400'
  const borderStyle = ticket.type === 10 ? 'double' : 'solid'
  const borderColor = ticket.type === 1 ? 'border-cyan-400' : ticket.type === 5 ? 'border-green-500' : 'border-yellow-400'

  // Instructions shown below grid
  const instructions =
    ticket.type === 1
      ? ['Match 2 symbols → WIN $2', 'Match 3 symbols → WIN $5']
      : ticket.type === 5
      ? ['Match all 3 in a row to win that row\'s prize', 'Both rows → $35 total']
      : ['Match all 3 in a row to win that row\'s prize', 'All rows → $170 total']

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Ticket header */}
        <div className={`border-2 p-4 mb-4 ${borderColor}`} style={{ borderStyle }}>
          <div className="flex justify-between items-center">
            <div>
              <span className={`font-bold text-2xl ${headerColor}`}>${ticket.type}</span>
              <span className="text-gray-300 ml-3 uppercase tracking-widest font-bold">
                {ticket.name}
              </span>
            </div>
            <span className="text-gray-500 text-xs uppercase">SCRATCH-OFF</span>
          </div>
        </div>

        {/* Wallet */}
        <div className="panel border p-2 mb-4 flex justify-between text-sm">
          <span className="text-gray-400 uppercase tracking-wider">WALLET</span>
          <span className="text-green-500 font-bold">${money.toFixed(2)}</span>
        </div>

        {/* Ticket grid */}
        <div className={`border-2 p-5 mb-4 ${borderColor} space-y-4`} style={{ borderStyle }}>
          <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">
            {fullyScratched ? 'RESULT' : '▼ CLICK CELLS TO SCRATCH ▼'}
          </div>

          {ticket.cells.map((row, ri) => (
            <TicketRow
              key={ri}
              cells={row}
              rowPrize={rowPrizes[ri]}
              allScratched={rowResults[ri]?.allRevealed ?? false}
              win={rowResults[ri]?.win ?? false}
              onScratch={(col) => scratchCell(ri, col)}
            />
          ))}

          {/* $1 ticket: single row, show result below cells once scratched */}
          {isDollarTicket && fullyScratched && (
            <div
              className={`text-center font-bold text-lg mt-2 ${
                ticket.prize > 0 ? 'text-green-500 flash-success' : 'text-gray-600'
              }`}
            >
              {ticket.prize === 5
                ? '★ THREE OF A KIND — WIN $5 ★'
                : ticket.prize === 2
                ? '★ MATCH — WIN $2 ★'
                : 'NO MATCH'}
            </div>
          )}
        </div>

        {/* Instructions / win message */}
        {!fullyScratched && (
          <div className="panel border p-3 mb-4 text-sm text-gray-500 space-y-1">
            {instructions.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {fullyScratched && ticket.prize > 0 && !isDollarTicket && (
          <div className="panel-double border-2 p-3 mb-4 text-center" style={{ borderStyle: 'double' }}>
            <div className="text-green-500 font-bold text-lg flash-success">
              {ticket.winMessage}
            </div>
            <div className="text-green-400 text-sm mt-1">
              +${ticket.prize}.00 added to wallet
            </div>
          </div>
        )}

        {fullyScratched && ticket.prize === 0 && (
          <div className="panel border p-3 mb-4 text-center text-gray-600 text-sm">
            Better luck next time.
          </div>
        )}

        {/* Action buttons */}
        {!fullyScratched && (
          <button
            className="btn btn-secondary w-full py-3 mb-3 uppercase tracking-wider font-bold"
            onClick={scratchAll}
          >
            [ SCRATCH ALL ]
          </button>
        )}

        {fullyScratched && (
          <div className="space-y-3">
            <button
              className="btn btn-primary w-full py-3 uppercase tracking-wider font-bold"
              onClick={goToStore}
            >
              [ BUY ANOTHER TICKET ]
            </button>
            <button
              className="btn btn-warning w-full py-3 uppercase tracking-wider font-bold"
              onClick={goToEndOfDay}
            >
              [ END THE DAY ]
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
