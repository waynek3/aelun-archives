/**
 * Centralized error handling utility
 * Surfaces async errors to users instead of just logging to console
 */

import { useUIStore } from '@/stores/uiStore'

export interface AppError {
  message: string
  code?: string
  context?: string
  originalError?: Error
  userFacingMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class ErrorHandler {
  private static instance: ErrorHandler

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle an async error and notify the user
   */
  handleError(error: unknown, context?: string): AppError {
    const appError = this.normalizeError(error, context)

    // Log to console for debugging
    console.error(`[${appError.severity.toUpperCase()}] ${appError.context}: ${appError.message}`, appError.originalError)

    // Show notification to user based on severity
    this.notifyUser(appError)

    return appError
  }

  /**
   * Normalize different error types into a consistent format
   */
  private normalizeError(error: unknown, context?: string): AppError {
    if (error instanceof Error) {
      return this.createAppError(error.message, context, error)
    }

    if (typeof error === 'string') {
      return this.createAppError(error, context)
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return this.createAppError(String(error.message), context)
    }

    return this.createAppError('An unknown error occurred', context)
  }

  /**
   * Create an AppError with user-friendly message
   */
  private createAppError(message: string, context?: string, originalError?: Error): AppError {
    const severity = this.determineSeverity(message, context)
    const userFacingMessage = this.createUserFacingMessage(message, severity, context)

    return {
      message,
      context: context || 'Unknown',
      originalError,
      userFacingMessage,
      severity,
    }
  }

  /**
   * Determine error severity based on message and context
   */
  private determineSeverity(message: string, context?: string): AppError['severity'] {
    const messageLower = message.toLowerCase()
    const contextLower = context?.toLowerCase() || ''

    // Critical errors
    if (
      messageLower.includes('database') ||
      messageLower.includes('indexeddb') ||
      messageLower.includes('save') ||
      contextLower.includes('persistence')
    ) {
      return 'critical'
    }

    // High severity
    if (
      messageLower.includes('character') ||
      messageLower.includes('game state') ||
      contextLower.includes('game loop')
    ) {
      return 'high'
    }

    // Medium severity
    if (
      messageLower.includes('load') ||
      messageLower.includes('fetch') ||
      contextLower.includes('content')
    ) {
      return 'medium'
    }

    // Low severity
    return 'low'
  }

  /**
   * Create user-friendly error message
   */
  private createUserFacingMessage(message: string, severity: AppError['severity'], context?: string): string {
    const messageLower = message.toLowerCase()

    // IndexedDB / Database errors
    if (messageLower.includes('indexeddb') || messageLower.includes('database')) {
      if (severity === 'critical') {
        return 'Failed to save your progress. Please check if you have enough storage space and refresh the page.'
      }
      return 'Database operation failed. Your progress may not be saved.'
    }

    // Network / Loading errors
    if (messageLower.includes('load') || messageLower.includes('fetch')) {
      return 'Failed to load game content. Please refresh the page to try again.'
    }

    // Character errors
    if (messageLower.includes('character')) {
      return 'An error occurred with your character data. Please try again or create a new character.'
    }

    // Game state errors
    if (messageLower.includes('game state') || messageLower.includes('turn')) {
      return 'The game encountered an error. Your progress has been saved, but you may need to refresh.'
    }

    // Generic error with context
    if (context) {
      return `An error occurred in ${context}. Please try again.`
    }

    // Fallback
    return 'An unexpected error occurred. Please try again or refresh the page.'
  }

  /**
   * Notify user through UI store
   */
  private notifyUser(error: AppError): void {
    const { showNotification } = useUIStore.getState()

    if (!showNotification) {
      return
    }

    // Determine notification duration based on severity
    const duration = error.severity === 'critical' ? 10000 : error.severity === 'high' ? 7000 : 5000

    showNotification(error.userFacingMessage, duration)
  }

  /**
   * Handle promise rejections
   */
  handlePromiseRejection(error: unknown, context?: string): AppError {
    return this.handleError(error, context || 'Unhandled Promise Rejection')
  }

  /**
   * Wrap an async function with error handling
   */
  wrapAsync<T extends (...args: never[]) => Promise<unknown>>(
    fn: T,
    context: string
  ): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      try {
        return await fn(...args) as ReturnType<T>
      } catch (error) {
        this.handleError(error, context)
        return null
      }
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Convenience function for error handling
export function handleAsyncError(error: unknown, context?: string): AppError {
  return errorHandler.handleError(error, context)
}

// Convenience function for wrapping async functions
export function wrapAsyncOperation<T extends (...args: never[]) => Promise<unknown>>(
  fn: T,
  context: string
): (...args: Parameters<T>) => Promise<ReturnType<T> | null> {
  return errorHandler.wrapAsync(fn, context)
}
