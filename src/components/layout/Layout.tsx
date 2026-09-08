import { Link, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import CompareDrawer from '../CompareDrawer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p>© AJ McKenna · AAIndex Explorer</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400">About</Link>
            <Link to="/guide" className="hover:text-indigo-600 dark:hover:text-indigo-400">Guide</Link>
            <Link to="/api-reference" className="hover:text-indigo-600 dark:hover:text-indigo-400">API</Link>
            <a
              href="https://github.com/amckenna41"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              GitHub ↗
            </a>
            <a
              href="https://www.genome.jp/aaindex/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              AAIndex source ↗
            </a>
          </nav>
        </div>
      </footer>
      <CompareDrawer />
    </div>
  )
}
