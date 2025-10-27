import { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Card } from '@/components/ui/Card';
import type { ActionCard } from '@/types/cards';

interface TargetSelectionScreenProps {
  actionCard: ActionCard;
  onTargetSelected: (targetId: string) => void;
  onCancel: () => void;
}

interface TargetOption {
  id: string;
  name: string;
  description: string;
  isPrimary: boolean;
  difficulty?: number;
  preview?: string;
}

export default function TargetSelectionScreen({ 
  actionCard, 
  onTargetSelected, 
  onCancel 
}: TargetSelectionScreenProps) {
  const { currentPredicate } = useGameStore();
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  useEffect(() => {
    generateTargets();
  }, [actionCard, currentPredicate]);

  const getPredicateInfo = (predicateId: string) => {
    // Map of predicate IDs to their info
    const predicateMap: Record<string, { name: string; description: string; difficulty: number; preview: string }> = {
      'homestead': {
        name: 'THE HOMESTEAD',
        description: 'Return to your safe haven',
        difficulty: 8,
        preview: 'A place of rest and routine...'
      },
      'gnarled_woods': {
        name: 'THE GNARLED WOODS',
        description: 'Twisted branches and lurking eyes',
        difficulty: 12,
        preview: 'Danger lurks in the shadows...'
      },
      'ancient_ruins': {
        name: 'ANCIENT RUINS',
        description: 'Crumbling stones of forgotten power',
        difficulty: 15,
        preview: 'Mysteries await the brave...'
      },
      'rusty_anchor_tavern': {
        name: 'THE RUSTY ANCHOR TAVERN',
        description: 'A rowdy gathering place for travelers',
        difficulty: 10,
        preview: 'Stories and ale flow freely...'
      },
      'monastery_st_aelun': {
        name: 'THE MONASTERY OF ST. AELUN',
        description: 'A place of learning and contemplation',
        difficulty: 8,
        preview: 'Wisdom and peace await...'
      },
      'bandit_camp': {
        name: 'BANDIT CAMP',
        description: 'A dangerous den of thieves',
        difficulty: 16,
        preview: 'Only the bold dare enter...'
      },
      'healing_spring': {
        name: 'HEALING SPRING',
        description: 'A mystical source of restoration',
        difficulty: 12,
        preview: 'The waters hold ancient power...'
      },
      'trading_post': {
        name: 'TRADING POST',
        description: 'A bustling center of commerce',
        difficulty: 10,
        preview: 'Gold and goods exchange hands...'
      },
      'cursed_forest': {
        name: 'CURSED FOREST',
        description: 'A dark and twisted woodland',
        difficulty: 18,
        preview: 'Evil permeates the very air...'
      }
    };
    
    return predicateMap[predicateId] || {
      name: predicateId.replace(/_/g, ' ').toUpperCase(),
      description: `Travel to ${predicateId.replace(/_/g, ' ')}`,
      difficulty: 10,
      preview: 'A new adventure awaits...'
    };
  };

  const generateTargets = () => {
    const newTargets: TargetOption[] = [];

    if (actionCard.id === 'pray') {
      newTargets.push(
        {
          id: 'local_spirit',
          name: 'THE FOREST ITSELF',
          description: 'Pray to the local nature spirits',
          isPrimary: true,
          difficulty: 12,
          preview: 'The ancient trees seem to listen...'
        },
        {
          id: 'personal_deity',
          name: 'A GOD YOU REVERE',
          description: 'Call upon your chosen deity',
          isPrimary: false,
          difficulty: 15,
          preview: 'Your faith burns bright...'
        },
        {
          id: 'unknown_power',
          name: 'AN UNKNOWN POWER',
          description: 'Reach out to mysterious forces',
          isPrimary: false,
          difficulty: 18,
          preview: 'Something stirs in the darkness...'
        }
      );
    } else if (actionCard.id === 'travel') {
      // Get available exits from current predicate
      const exits = currentPredicate?.exits || [];
      exits.forEach((exit, index) => {
        // Get predicate info for better descriptions
        const predicateInfo = getPredicateInfo(exit);
        newTargets.push({
          id: exit,
          name: predicateInfo.name || exit.replace(/_/g, ' ').toUpperCase(),
          description: predicateInfo.description || `Travel to ${exit.replace(/_/g, ' ')}`,
          isPrimary: index === 0,
          difficulty: predicateInfo.difficulty || 10,
          preview: predicateInfo.preview || 'A new adventure awaits...'
        });
      });
    } else if (actionCard.id === 'bargain') {
      newTargets.push(
        {
          id: 'local_merchant',
          name: 'LOCAL MERCHANT',
          description: 'Negotiate with nearby traders',
          isPrimary: true,
          difficulty: 12,
          preview: 'Gold speaks louder than words...'
        },
        {
          id: 'traveling_peddler',
          name: 'TRAVELING PEDDLER',
          description: 'Haggle with a wandering seller',
          isPrimary: false,
          difficulty: 15,
          preview: 'Exotic wares from distant lands...'
        }
      );
    } else if (actionCard.id === 'intimidate') {
      newTargets.push(
        {
          id: 'bandit_leader',
          name: 'BANDIT LEADER',
          description: 'Intimidate the local troublemaker',
          isPrimary: true,
          difficulty: 14,
          preview: 'Fear is a powerful weapon...'
        },
        {
          id: 'guards',
          name: 'LOCAL GUARDS',
          description: 'Browbeat the town watch',
          isPrimary: false,
          difficulty: 16,
          preview: 'Authority can be challenged...'
        }
      );
    } else if (actionCard.id === 'persuade') {
      newTargets.push(
        {
          id: 'townsfolk',
          name: 'TOWNSFOLK',
          description: 'Convince the common people',
          isPrimary: true,
          difficulty: 12,
          preview: 'Words can move mountains...'
        },
        {
          id: 'noble',
          name: 'LOCAL NOBLE',
          description: 'Persuade someone of influence',
          isPrimary: false,
          difficulty: 16,
          preview: 'The powerful are harder to sway...'
        }
      );
    } else if (actionCard.id === 'steal') {
      newTargets.push(
        {
          id: 'merchant',
          name: 'MERCHANT',
          description: 'Pickpocket a trader',
          isPrimary: true,
          difficulty: 14,
          preview: 'Gold jingles in their purse...'
        },
        {
          id: 'noble',
          name: 'NOBLE',
          description: 'Steal from someone wealthy',
          isPrimary: false,
          difficulty: 18,
          preview: 'Rich pickings, but dangerous...'
        },
        {
          id: 'commoner',
          name: 'COMMONER',
          description: 'Take from the common folk',
          isPrimary: false,
          difficulty: 10,
          preview: 'Easy target, but little reward...'
        }
      );
    } else if (actionCard.id === 'perform') {
      newTargets.push(
        {
          id: 'tavern_crowd',
          name: 'TAVERN CROWD',
          description: 'Entertain the common folk',
          isPrimary: true,
          difficulty: 12,
          preview: 'A rowdy but appreciative audience...'
        },
        {
          id: 'noble_court',
          name: 'NOBLE COURT',
          description: 'Perform for the elite',
          isPrimary: false,
          difficulty: 16,
          preview: 'Sophisticated tastes and high standards...'
        },
        {
          id: 'street_corner',
          name: 'STREET CORNER',
          description: 'Busk for passersby',
          isPrimary: false,
          difficulty: 8,
          preview: 'Simple folk with simple needs...'
        }
      );
    } else if (actionCard.id === 'lead') {
      newTargets.push(
        {
          id: 'townsfolk',
          name: 'TOWNSFOLK',
          description: 'Lead the common people',
          isPrimary: true,
          difficulty: 12,
          preview: 'They look to you for guidance...'
        },
        {
          id: 'mercenaries',
          name: 'MERCENARIES',
          description: 'Command hired fighters',
          isPrimary: false,
          difficulty: 15,
          preview: 'Professional soldiers need strong leadership...'
        },
        {
          id: 'refugees',
          name: 'REFUGEES',
          description: 'Guide the displaced',
          isPrimary: false,
          difficulty: 10,
          preview: 'Desperate people seeking hope...'
        }
      );
    }

    setTargets(newTargets);
  };

  const handleTargetSelect = (targetId: string) => {
    setSelectedTarget(targetId);
  };

  const handleConfirm = () => {
    if (selectedTarget) {
      onTargetSelected(selectedTarget);
    }
  };

  const getActionType = () => {
    switch (actionCard.id) {
      case 'pray': return 'PRAYER';
      case 'travel': return 'TRAVEL';
      case 'bargain': return 'BARGAIN';
      case 'intimidate': return 'INTIMIDATION';
      case 'persuade': return 'PERSUASION';
      case 'steal': return 'THEFT';
      case 'perform': return 'PERFORMANCE';
      case 'lead': return 'LEADERSHIP';
      default: return 'ACTION';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-green-400">
          SELECT {getActionType()} TARGET
        </h1>
        <Button onClick={onCancel} variant="secondary">
          CANCEL
        </Button>
      </div>

      {/* Context Info */}
      <Panel className="mb-4">
        <div className="text-sm text-cyan-400">
          <strong>Action:</strong> {actionCard.name}<br/>
          <strong>Location:</strong> {currentPredicate?.name || 'Unknown'}<br/>
          <strong>Description:</strong> {actionCard.description}
        </div>
      </Panel>

      {/* Target Options */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {targets.map((target) => (
            <Card
              key={target.id}
              title={target.name}
              className={`cursor-pointer transition-all ${
                selectedTarget === target.id
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : target.isPrimary
                  ? 'border-green-400 hover:border-yellow-400'
                  : 'border-cyan-400 hover:border-yellow-400'
              }`}
              onClick={() => handleTargetSelect(target.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm text-gray-300 mt-1">
                    {target.description}
                  </p>
                  {target.preview && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      {target.preview}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {target.difficulty && (
                    <div className="text-sm text-orange-400">
                      DC {target.difficulty}
                    </div>
                  )}
                  {selectedTarget === target.id && (
                    <div className="text-yellow-400 mt-1">✓</div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-4 flex justify-center">
        <Button
          onClick={handleConfirm}
          disabled={!selectedTarget}
          variant="primary"
          className="px-8"
        >
          {selectedTarget ? `CONFIRM ${getActionType()}` : 'SELECT A TARGET'}
        </Button>
      </div>
    </div>
  );
}