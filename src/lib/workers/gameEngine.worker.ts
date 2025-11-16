/**
 * Game Engine Web Worker
 * Handles heavy computation off the main thread
 */

import { resolveAction } from '../engine/predicateEngine';
import type { ActionCard, PredicateCard } from '../../types/cards';
import type { Character } from '../../types/character';
import type { DiceResult } from '../engine/diceSystem';

interface WorkerCommand {
  type: string;
  payload: unknown;
  requestId: string;
}

interface WorkerResponse {
  type: string;
  payload: unknown;
  requestId: string;
  error?: string;
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const { type, payload, requestId } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'RESOLVE_ACTION':
        result = await resolveAction(payload as { actionCard: ActionCard; predicateCard: PredicateCard; character: Character; diceResult: DiceResult; selectedEntity?: string });
        break;
        
      case 'ROLL_DICE_POOL':
        // This would be implemented if we move dice rolling to worker
        result = { error: 'Dice rolling not implemented in worker yet' };
        break;
        
      default:
        throw new Error(`Unknown command: ${type}`);
    }
    
    const response: WorkerResponse = {
      type: `${type}_SUCCESS`,
      payload: result,
      requestId
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = {
      type: `${type}_ERROR`,
      payload: null,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(response);
  }
};