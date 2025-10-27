/**
 * Web Worker Client
 * Provides a Promise-based API for communicating with the game engine worker
 */

import type { ActionCard, PredicateCard } from '@/types/cards';
import type { Character } from '@/types/character';
import type { DiceResult } from '../engine/diceSystem';
import type { Outcome } from '../engine/predicateEngine';

// Worker communication interfaces

class GameEngineClient {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = new Map();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    try {
      this.worker = new Worker(
        new URL('../workers/gameEngine.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      this.worker.onmessage = (event) => {
        const { requestId, payload, error } = event.data;
        const request = this.pendingRequests.get(requestId);
        
        if (request) {
          if (error) {
            request.reject(new Error(error));
          } else {
            request.resolve(payload);
          }
          this.pendingRequests.delete(requestId);
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        // Reject all pending requests
        for (const [, request] of this.pendingRequests) {
          request.reject(new Error('Worker error'));
        }
        this.pendingRequests.clear();
      };
    } catch (error) {
      console.warn('Failed to initialize worker, falling back to main thread:', error);
    }
  }

  private async sendCommand(type: string, payload: any): Promise<any> {
    if (!this.worker) {
      // Fallback to main thread if worker not available
      throw new Error('Worker not available');
    }

    const requestId = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker!.postMessage({
        type,
        payload,
        requestId
      });
    });
  }

  /**
   * Resolve an action using the worker
   */
  async resolveAction(params: {
    actionCard: ActionCard;
    predicateCard: PredicateCard;
    character: Character;
    diceResult: DiceResult;
  }): Promise<Outcome> {
    try {
      return await this.sendCommand('RESOLVE_ACTION', params);
    } catch (error) {
      console.warn('Worker failed, falling back to main thread:', error);
      // Fallback to main thread implementation
      const { resolveAction } = await import('../engine/predicateEngine');
      return resolveAction(params);
    }
  }

  /**
   * Clean up worker
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const gameEngine = new GameEngineClient();