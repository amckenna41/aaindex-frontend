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
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
          <div className="max-w-md text-center px-6">
            <p className="text-5xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 break-words">
              {this.state.message}
            </p>
            {/* Clearing hasError alone just re-throws: the failing route is
                still mounted. A full navigation resets route and subtree. */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 text-sm"
              >
                Reload
              </button>
              <button
                onClick={() => window.location.assign('/explorer')}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
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
