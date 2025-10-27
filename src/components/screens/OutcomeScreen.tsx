import { ScreenContainer } from '@/components/ui/Layout';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useUIStore } from '@/stores/uiStore';
import { useGameStore } from '@/stores/gameStore';
import type { Outcome } from '@/lib/engine/predicateEngine';

interface OutcomeScreenProps {
  outcome: Outcome;
  onContinue: () => void;
}

export default function OutcomeScreen({ outcome, onContinue }: OutcomeScreenProps) {
  const setScreen = useUIStore((s) => s.setScreen);
  const character = useGameStore((s) => s.character);

  const getOutcomeColor = () => {
    if (outcome.criticalSuccess) return 'text-green-400';
    if (outcome.success) return 'text-green-500';
    if (outcome.criticalFailure) return 'text-red-400';
    return 'text-red-500';
  };

  const getOutcomeSymbol = () => {
    if (outcome.criticalSuccess) return '★★★';
    if (outcome.success) return '✓';
    if (outcome.criticalFailure) return '✗✗';
    return '✗';
  };

  return (
    <ScreenContainer>
      <div className="py-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className={`font-bold uppercase ${getOutcomeColor()}`}>
            {getOutcomeSymbol()} OUTCOME
          </h2>
          <Button variant="secondary" onClick={() => setScreen('GameLoop')}>
            ◄ BACK
          </Button>
        </header>

        {/* Narrative Panel */}
        <Panel className="p-4">
          <h3 className="text-cyan-400 font-bold uppercase mb-3">What Happens</h3>
          <p className="text-gray-300 leading-relaxed">{outcome.text}</p>
        </Panel>

        {/* Mechanical Updates */}
        {outcome.effects.length > 0 && (
          <Panel className="p-4">
            <h3 className="text-cyan-400 font-bold uppercase mb-3">⚙ Mechanical Updates</h3>
            <div className="space-y-2">
              {outcome.effects.map((effect, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-300">
                    {formatEffect(effect)}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Character Status */}
        {character && (
          <Panel className="p-4">
            <h3 className="text-cyan-400 font-bold uppercase mb-3">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Health:</span>
                <span className="ml-2 text-white">
                  {character.currentHP || 0}/{character.maxHP || 10}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Turn:</span>
                <span className="ml-2 text-white">{character.turnCount || 0}</span>
              </div>
            </div>
          </Panel>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <Button onClick={onContinue} className="text-lg px-8 py-3">
            ► CONTINUE
          </Button>
        </div>
      </div>
    </ScreenContainer>
  );
}

/**
 * Format an effect for display
 */
function formatEffect(effect: {
  type: string;
  value?: number;
  resource?: string;
  entity?: string;
  id?: string;
  flag?: string;
  flagValue?: any;
  location?: string;
}): string {
  switch (effect.type) {
    case 'damage': {
      return `Deal ${effect.value} damage`;
    }
    case 'heal': {
      return `Heal ${effect.value} health`;
    }
    case 'gain': {
      return `Gain ${effect.value} ${effect.resource}`;
    }
    case 'lose': {
      return `Lose ${effect.value} ${effect.resource}`;
    }
    case 'affinity': {
      const change = effect.value && effect.value > 0 ? `+${effect.value}` : effect.value?.toString() || '0';
      return `${effect.entity} affinity ${change}`;
    }
    case 'unlock': {
      return `Discover ${effect.id}`;
    }
    case 'flag': {
      return `Set ${effect.flag} = ${effect.flagValue}`;
    }
    case 'transition': {
      return `Travel to ${effect.location}`;
    }
    default: {
      return `Unknown effect: ${effect.type}`;
    }
  }
}