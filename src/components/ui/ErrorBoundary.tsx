import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './Button'
import { ScreenContainer } from './Layout'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ScreenContainer>
          <div className="py-12 text-center">
            <h2 className="text-xl text-red-400 font-bold uppercase mb-4">
              ⚠ ERROR OCCURRED ⚠
            </h2>
            <div className="panel p-4 text-sm text-cyan-400 mb-6">
              <p className="mb-2">Something went wrong with the game.</p>
              {import.meta.env.DEV && this.state.error && (
                <details className="text-xs text-left mt-2">
                  <summary className="cursor-pointer text-yellow-400">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
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

    return this.props.children
  }
}