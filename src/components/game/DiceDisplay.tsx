import type { DiceResult } from '@/lib/engine/diceSystem';
import { getDieFace, getResultSymbol, getResultColorClass } from '@/lib/engine/diceSystem';

interface DiceDisplayProps {
  result: DiceResult;
  dc: number;
  isRolling?: boolean;
}

export function DiceDisplay({ result, dc, isRolling = false }: DiceDisplayProps) {
  const resultSymbol = getResultSymbol(result, dc);
  const resultColorClass = getResultColorClass(result, dc);

  return (
    <div className="space-y-4">
      {/* Advantage Dice Section */}
      <div>
        <h4 className="text-cyan-400 text-sm font-bold uppercase mb-2">Advantage Dice (d20)</h4>
        <div className="flex gap-2 items-center">
          {result.advantageRolls.map((roll, index) => (
            <div
              key={index}
              className={`text-2xl ${
                roll === result.keptRoll ? 'text-green-400 font-bold' : 'text-gray-400'
              }`}
            >
              {isRolling ? '⚀' : getDieFace(roll, 20)}
            </div>
          ))}
          <span className="text-sm text-gray-400 ml-2">
            (kept: {result.keptRoll})
          </span>
        </div>
      </div>

      {/* Bonus Dice Section */}
      {result.bonusRolls.length > 0 && (
        <div>
          <h4 className="text-cyan-400 text-sm font-bold uppercase mb-2">Bonus Dice</h4>
          <div className="space-y-1">
            {result.bonusRolls.map(({ die, result: roll }, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-xl">
                  {isRolling ? '⚀' : getDieFace(roll, die.faces)}
                </span>
                <span className="text-gray-300">
                  +{roll} ({die.source})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Result */}
      <div className="border-t border-gray-600 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-cyan-400 font-bold">TOTAL: </span>
            <span className="text-2xl font-bold">{result.total}</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">vs DC {dc}</div>
            <div className={`text-xl font-bold ${resultColorClass}`}>
              {resultSymbol}
            </div>
          </div>
        </div>
      </div>

      {/* Critical Indicators */}
      {(result.criticalSuccess || result.criticalFailure) && (
        <div className={`text-center font-bold ${
          result.criticalSuccess ? 'text-green-400' : 'text-red-400'
        }`}>
          {result.criticalSuccess ? '★★★ CRITICAL SUCCESS! ★★★' : '✗✗ CRITICAL FAILURE ✗✗'}
        </div>
      )}
    </div>
  );
}
