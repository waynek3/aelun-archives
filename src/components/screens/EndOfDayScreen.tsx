import { useGameStore } from '@/stores/gameStore'

export default function EndOfDayScreen() {
  const money = useGameStore(s => s.money)
  const startMoney = useGameStore(s => s.startMoney)
  const sessionTickets = useGameStore(s => s.sessionTickets)
  const highScores = useGameStore(s => s.highScores)
  const endDay = useGameStore(s => s.endDay)
  const startNewDay = useGameStore(s => s.startNewDay)
  const goToStore = useGameStore(s => s.goToStore)
  const screen = useGameStore(s => s.screen)

  const netChange = money - startMoney
  const totalWon = sessionTickets.reduce((sum, t) => sum + t.prize, 0)

  // endDay triggers score submission + navigates to endofday
  // If we're already on endofday screen (score already submitted), show results
  const isEndCommitted = screen === 'endofday'

  function handleEndDay() {
    endDay()
  }

  const netColor = netChange >= 0 ? 'text-green-500' : 'text-red-400'
  const netSign = netChange >= 0 ? '+' : ''

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="panel-heavy border-3 p-4 mb-4 text-center" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#FF8800' }}>
          <div className="text-orange-400 font-bold text-xl uppercase tracking-widest">
            ┏━━ END OF DAY ━━┓
          </div>
        </div>

        {/* Day summary */}
        <div className="panel border p-4 mb-4 space-y-2 text-sm font-mono">
          <div className="text-gray-400 uppercase tracking-wider text-xs mb-3">— SESSION SUMMARY —</div>

          <div className="flex justify-between">
            <span className="text-gray-400">Started with</span>
            <span className="text-gray-300">${startMoney.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tickets bought</span>
            <span className="text-gray-300">{sessionTickets.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total won</span>
            <span className="text-gray-300">${totalWon.toFixed(2)}</span>
          </div>

          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="flex justify-between font-bold text-base">
              <span className="text-gray-300">Final wallet</span>
              <span className="text-green-500">${money.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Net change</span>
              <span className={netColor}>{netSign}${netChange.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* High scores */}
        <div className="panel-double border-2 p-4 mb-4" style={{ borderStyle: 'double' }}>
          <div className="text-green-500 font-bold uppercase tracking-wider text-sm mb-3">
            ★ HIGH SCORES ★
          </div>

          {highScores.length === 0 ? (
            <div className="text-gray-600 text-sm">No scores yet. End the day to submit yours!</div>
          ) : (
            <div className="space-y-1 text-sm font-mono">
              <div className="text-gray-600 text-xs grid grid-cols-4 gap-2 mb-2">
                <span>#</span>
                <span>WALLET</span>
                <span>TICKETS</span>
                <span>DATE</span>
              </div>
              {highScores.map((score, i) => {
                const isTopThree = i < 3
                const rankColor = i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-4 gap-2 ${isTopThree ? rankColor : 'text-gray-500'}`}
                  >
                    <span>{i + 1}.</span>
                    <span>${score.finalMoney.toFixed(2)}</span>
                    <span>{score.ticketsBought}</span>
                    <span className="text-xs">{score.date}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isEndCommitted ? (
          // Still in "preview" mode before committing end of day
          <div className="space-y-3">
            <button
              className="btn btn-primary w-full py-3 uppercase tracking-wider font-bold"
              onClick={goToStore}
            >
              [ BACK TO STORE ]
            </button>
            <button
              className="btn btn-warning w-full py-3 uppercase tracking-wider font-bold"
              onClick={handleEndDay}
            >
              [ END THE DAY & SUBMIT SCORE ]
            </button>
          </div>
        ) : (
          // Score submitted — can only start new day
          <div className="space-y-3">
            <div className="text-center text-gray-500 text-xs uppercase tracking-wider mb-1">
              Score submitted
            </div>
            <button
              className="btn btn-primary w-full py-3 uppercase tracking-wider font-bold"
              onClick={startNewDay}
            >
              [ PLAY AGAIN — NEW DAY ]
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
