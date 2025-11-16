import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'
import { ScreenContainer } from './Layout'
import { handleAsyncError } from '@/lib/utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeout?: ReturnType<typeof setTimeout>

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to centralized error handler
    handleAsyncError(error, 'React Error Boundary')

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Update state with error info
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))

    // Prevent infinite error loops
    if (this.state.errorCount > 5) {
      console.error('Too many errors detected. Stopping auto-recovery.')
      return
    }

    // Auto-reset after 10 seconds in development
    if (import.meta.env.DEV) {
      this.resetTimeout = setTimeout(() => {
        this.handleReset()
      }, 10000)
    }
  }

  componentWillUnmount() {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }
  }

  handleReset = () => {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorCount: 0
    })
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state
    const { children, fallback, isolate } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Isolate errors to this subtree
      if (isolate) {
        return (
          <div className="panel p-4 border-red-500">
            <p className="text-red-400 text-sm">
              This component encountered an error and couldn't render.
            </p>
            <button
              onClick={this.handleReset}
              className="mt-2 text-xs text-yellow-400 underline hover:text-yellow-300"
            >
              Try Again
            </button>
          </div>
        )
      }

      // Default full-page error UI
      return (
        <ScreenContainer>
          <div className="py-12 text-center max-w-2xl mx-auto">
            <h2 className="text-xl text-red-400 font-bold uppercase mb-4">
              ⚠ ERROR OCCURRED ⚠
            </h2>
            <div className="panel p-4 text-sm text-cyan-400 mb-6">
              <p className="mb-2">The application encountered an unexpected error.</p>
              <p className="text-xs text-gray-400">Your progress has been saved.</p>

              {error && (
                <details className="text-xs text-left mt-4">
                  <summary className="cursor-pointer text-yellow-400 hover:text-yellow-300">
                    Error Details (for debugging)
                  </summary>
                  <div className="mt-2 bg-black p-3 rounded overflow-auto max-h-64">
                    <div className="mb-2">
                      <strong className="text-red-400">Error:</strong>
                      <pre className="mt-1 text-gray-300 whitespace-pre-wrap">
                        {error.toString()}
                      </pre>
                    </div>
                    {error.stack && (
                      <div className="mb-2">
                        <strong className="text-red-400">Stack:</strong>
                        <pre className="mt-1 text-gray-300 whitespace-pre-wrap text-xs">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong className="text-red-400">Component Stack:</strong>
                        <pre className="mt-1 text-gray-300 whitespace-pre-wrap text-xs">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            {errorCount > 1 && (
              <div className="panel p-3 mb-4 bg-red-900/30 border-red-500">
                <p className="text-red-300 text-sm">
                  ⚠ This error has occurred {errorCount} times. Refreshing the page is recommended.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={this.handleReset}>► TRY AGAIN</Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                ► RELOAD PAGE
              </Button>
            </div>
          </div>
        </ScreenContainer>
      )
    }

    return children
  }
}