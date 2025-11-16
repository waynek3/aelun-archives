/**
 * Simple performance monitoring utility
 * Tracks render times, action durations, and provides performance insights
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  context?: Record<string, unknown>
}

interface PerformanceStats {
  count: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
  lastDuration: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private activeTimers: Map<string, number> = new Map()
  private maxMetricsStored = 100
  private enabled = import.meta.env.DEV

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start timing an operation
   */
  start(name: string, context?: Record<string, unknown>): void {
    if (!this.enabled) return

    const key = context ? `${name}_${JSON.stringify(context)}` : name
    this.activeTimers.set(key, performance.now())
  }

  /**
   * End timing an operation and record the metric
   */
  end(name: string, context?: Record<string, unknown>): number {
    if (!this.enabled) return 0

    const key = context ? `${name}_${JSON.stringify(context)}` : name
    const startTime = this.activeTimers.get(key)

    if (!startTime) {
      console.warn(`Performance timer "${name}" was never started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.activeTimers.delete(key)

    this.recordMetric({
      name,
      duration,
      timestamp: Date.now(),
      context
    })

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, context)
    }

    return duration
  }

  /**
   * Measure an async function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) return fn()

    this.start(name, context)
    try {
      const result = await fn()
      this.end(name, context)
      return result
    } catch (error) {
      this.end(name, context)
      throw error
    }
  }

  /**
   * Measure a synchronous function
   */
  measure<T>(
    name: string,
    fn: () => T,
    context?: Record<string, unknown>
  ): T {
    if (!this.enabled) return fn()

    this.start(name, context)
    try {
      const result = fn()
      this.end(name, context)
      return result
    } catch (error) {
      this.end(name, context)
      throw error
    }
  }

  /**
   * Record a metric manually
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetricsStored) {
      this.metrics.shift()
    }
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(name: string): PerformanceStats | null {
    const relevantMetrics = this.metrics.filter(m => m.name === name)

    if (relevantMetrics.length === 0) {
      return null
    }

    const durations = relevantMetrics.map(m => m.duration)

    return {
      count: relevantMetrics.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      lastDuration: durations[durations.length - 1]
    }
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get a summary of all operations
   */
  getSummary(): Record<string, PerformanceStats> {
    const summary: Record<string, PerformanceStats> = {}
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))]

    for (const name of uniqueNames) {
      const stats = this.getStats(name)
      if (stats) {
        summary[name] = stats
      }
    }

    return summary
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.activeTimers.clear()
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    if (!this.enabled) return

    const summary = this.getSummary()
    console.group('Performance Summary')

    Object.entries(summary)
      .sort((a, b) => b[1].averageDuration - a[1].averageDuration)
      .forEach(([name, stats]) => {
        console.log(
          `${name}:`,
          `avg=${stats.averageDuration.toFixed(2)}ms`,
          `min=${stats.minDuration.toFixed(2)}ms`,
          `max=${stats.maxDuration.toFixed(2)}ms`,
          `count=${stats.count}`
        )
      })

    console.groupEnd()
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Convenience functions
export function startPerformanceTimer(name: string, context?: Record<string, unknown>): void {
  performanceMonitor.start(name, context)
}

export function endPerformanceTimer(name: string, context?: Record<string, unknown>): number {
  return performanceMonitor.end(name, context)
}

export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return performanceMonitor.measureAsync(name, fn, context)
}

export function measurePerformance<T>(
  name: string,
  fn: () => T,
  context?: Record<string, unknown>
): T {
  return performanceMonitor.measure(name, fn, context)
}

// Expose to window in development for debugging
if (import.meta.env.DEV) {
  (window as Window & { performanceMonitor: PerformanceMonitor }).performanceMonitor = performanceMonitor
}
