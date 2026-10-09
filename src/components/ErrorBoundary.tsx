import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error)
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper dark:bg-gray-950 text-gray-900 dark:text-gray-100">
          <div className="max-w-md text-center px-6">
            <h1 className="text-3xl font-medium tracking-tight mb-4">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 break-words">
              {this.state.message}
            </p>
            {/* Clearing hasError alone just re-throws: the failing route is
                still mounted. A full navigation resets route and subtree. */}
            <div className="flex items-baseline justify-center gap-6">
              <button
                onClick={() => window.location.reload()}
                className="btn-text"
              >
                Reload
              </button>
              <button
                onClick={() => window.location.assign('/explorer')}
                className="btn-primary"
              >
                Back to Explorer
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
