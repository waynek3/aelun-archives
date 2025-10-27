import { useState, useEffect } from 'react';
import { ScreenContainer } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { DiceDisplay } from '@/components/game/DiceDisplay';
import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import { buildDicePool, getDifficultyClass } from '@/lib/engine/dicePoolBuilder';
import { rollDicePool } from '@/lib/engine/diceSystem';
import type { ActionCard, PredicateCard } from '@/types/cards';
import type { DiceResult } from '@/lib/engine/diceSystem';

interface DicePoolScreenProps {
  actionCard: ActionCard;
  predicateCard: PredicateCard;
  onResult: (result: DiceResult) => void;
}

export default function DicePoolScreen({ actionCard, predicateCard, onResult }: DicePoolScreenProps) {
  const setScreen = useUIStore((s) => s.setScreen);
  const character = useGameStore((s) => s.character);
  const [dicePool, setDicePool] = useState<ReturnType<typeof buildDicePool> | null>(null);
  const [dc, setDc] = useState(10);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceResult | null>(null);

  // Build dice pool when component mounts
  useEffect(() => {
    if (character) {
      const pool = buildDicePool({
        character,
        actionCard,
        duplicateCards: 0 // TODO: Allow duplicate cards in future
      });
      setDicePool(pool);
      
      // Calculate DC
      const difficulty = getDifficultyClass(actionCard, predicateCard.sceneTags || []);
      setDc(difficulty);
    }
  }, [character, actionCard, predicateCard]);

  const handleRoll = async () => {
    if (!dicePool) return;
    
    setIsRolling(true);
    
    // Simulate rolling animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Roll the dice
    const rollResult = rollDicePool(dicePool, dc);
    setResult(rollResult);
    setIsRolling(false);
  };

  const handleContinue = () => {
    if (result) {
      onResult(result);
    }
  };

  if (!character || !dicePool) {
    return (
      <ScreenContainer>
        <div className="py-6 space-y-4">
          <div className="panel p-4 text-sm text-cyan-400">Loading dice pool...</div>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-green-500 font-bold uppercase">Dice Pool</h2>
          <Button variant="secondary" onClick={() => setScreen('GameLoop')}>◄ BACK</Button>
        </header>

        {/* Action Info */}
        <Panel className="p-4">
          <h3 className="text-cyan-400 font-bold uppercase mb-2">{actionCard.name}</h3>
          <p className="text-sm text-gray-300 mb-2">{actionCard.description}</p>
          <div className="flex gap-2 text-xs">
            {actionCard.tags.map(tag => (
              <span key={tag} className="tag">[{tag.toUpperCase()}]</span>
            ))}
            <span className="tag">[{actionCard.actionType.toUpperCase()}]</span>
          </div>
        </Panel>

        {/* Dice Pool Assembly */}
        <Panel className="p-4">
          <h3 className="text-cyan-400 font-bold uppercase mb-3">Dice Pool Assembly</h3>
          
          {/* Advantage Dice */}
          <div className="mb-4">
            <h4 className="text-sm font-bold mb-2">Advantage Dice (d20)</h4>
            <div className="flex gap-2">
              {Array.from({ length: dicePool.advantageDice }, (_, i) => (
                <div key={i} className="text-2xl text-gray-400">⚀</div>
              ))}
              <span className="text-sm text-gray-400 ml-2">
                ({dicePool.advantageDice} dice, keep highest)
              </span>
            </div>
          </div>

          {/* Bonus Dice */}
          {dicePool.bonusDice.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-bold mb-2">Bonus Dice</h4>
              <div className="space-y-1">
                {dicePool.bonusDice.map((die, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-xl">⚀</span>
                    <span className="text-gray-300">
                      +1d{die.faces} ({die.source})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty */}
          <div className="border-t border-gray-600 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Difficulty Class:</span>
              <span className="text-lg font-bold text-yellow-400">DC {dc}</span>
            </div>
          </div>
        </Panel>

        {/* Roll Button or Results */}
        {!result ? (
          <div className="text-center">
            <Button 
              onClick={handleRoll} 
              disabled={isRolling}
              className="text-lg px-8 py-3"
            >
              {isRolling ? 'ROLLING...' : '► ROLL DICE'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Display */}
            <Panel className="p-4">
              <DiceDisplay result={result} dc={dc} />
            </Panel>

            {/* Continue Button */}
            <div className="text-center">
              <Button onClick={handleContinue} className="text-lg px-8 py-3">
                ► CONTINUE
              </Button>
            </div>
          </div>
        )}
      </div>
    </ScreenContainer>
  );
}
